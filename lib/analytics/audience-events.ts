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

function anonymousId() {
  if (typeof window === 'undefined') return 'server';
  const existing = window.localStorage.getItem(ID_KEY);
  if (existing) return existing;
  const id = `anon_${crypto.randomUUID()}`;
  window.localStorage.setItem(ID_KEY, id);
  return id;
}

export function trackAudienceEvent(name: AudienceEventName, properties: AudienceEvent['properties'] = {}) {
  if (typeof window === 'undefined') return;
  const event: AudienceEvent = { id: crypto.randomUUID(), name, occurredAt: new Date().toISOString(), anonymousId: anonymousId(), properties };
  try {
    const current = JSON.parse(window.localStorage.getItem(KEY) || '[]') as AudienceEvent[];
    window.localStorage.setItem(KEY, JSON.stringify([...current.slice(-499), event]));
  } catch {}
}

export function readAudienceEvents(): AudienceEvent[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || '[]') as AudienceEvent[]; } catch { return []; }
}
