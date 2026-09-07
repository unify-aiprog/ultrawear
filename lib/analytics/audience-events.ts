export type AudienceEventName =
  | 'page_view'
  | 'live_view'
  | 'participation'
  | 'quest_accept'
  | 'community_post'
  | 'community_reaction'
  | 'interest_toggle'
  | 'follow_toggle';

export type AudienceEvent = {
  id: string;
  name: AudienceEventName;
  occurredAt: string;
  anonymousId: string;
  properties: Record<string, string | number | boolean>;
};

const KEY = 'uw-audience-events';
const ID_KEY = 'uw-anonymous-id';
const pending = new Set<string>();

function anonymousId() {
  if (typeof window === 'undefined') return 'server';
  const existing = window.localStorage.getItem(ID_KEY);
  if (existing) return existing;
  const id = `anon_${crypto.randomUUID()}`;
  window.localStorage.setItem(ID_KEY, id);
  return id;
}

function persistLocal(event: AudienceEvent) {
  try {
    const current = JSON.parse(window.localStorage.getItem(KEY) || '[]') as AudienceEvent[];
    if (current.some((item) => item.id === event.id)) return;
    window.localStorage.setItem(KEY, JSON.stringify([...current.slice(-499), event]));
  } catch {}
}

async function send(event: AudienceEvent) {
  if (pending.has(event.id)) return;
  pending.add(event.id);
  try {
    await fetch('/api/audience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    });
  } catch {}
  finally { pending.delete(event.id); }
}

export function trackAudienceEvent(name: AudienceEventName, properties: AudienceEvent['properties'] = {}) {
  if (typeof window === 'undefined') return;
  const event: AudienceEvent = { id: crypto.randomUUID(), name, occurredAt: new Date().toISOString(), anonymousId: anonymousId(), properties };
  persistLocal(event);
  void send(event);
}

export function readAudienceEvents(): AudienceEvent[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || '[]') as AudienceEvent[]; } catch { return []; }
}
