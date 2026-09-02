import { createSportradarSoccerClient } from '../../../../live-sports/providers/sportradar-soccer-client.js';
import { normalizeSportRadarSoccer } from '../../../../live-sports/providers/sportradar-soccer.js';
import { createEventIndexStore } from '../../../../live-sports/event-index.js';

function json(body, status = 200, cache = 'public, max-age=300, stale-while-revalidate=600') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });
}

function items(payload) {
  if (Array.isArray(payload?.summaries)) return payload.summaries;
  if (Array.isArray(payload?.sport_events)) return payload.sport_events;
  if (Array.isArray(payload?.schedules)) return payload.schedules;
  return [];
}

function normalizeItems(payload, observedAt) {
  return items(payload).map((item) => {
    try {
      return normalizeSportRadarSoccer(item, { observedAt });
    } catch {
      return null;
    }
  }).filter(Boolean);
}

async function publish(events, env) {
  if (!env.EVENT_STORE || !env.EVENT_INDEX) return false;
  const index = createEventIndexStore(env.EVENT_INDEX);
  await Promise.all(events.map(async (event) => {
    await env.EVENT_STORE.put(event.id, JSON.stringify(event));
    await index.put(event);
  }));
  return true;
}

export async function onRequestGet(context) {
  const date = new URL(context.request.url).searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const observedAt = new Date().toISOString();
  try {
    const payload = await createSportradarSoccerClient(context.env).dailySummaries(date);
    const events = normalizeItems(payload, observedAt);
    const published = await publish(events, context.env);
    return json({ source: 'Sportradar', feed: 'soccer-daily-summaries', date, observedAt, count: events.length, published, events });
  } catch (error) {
    return json({ source: 'Sportradar', feed: 'soccer-daily-summaries', date, observedAt, error: error instanceof Error ? error.message : String(error) }, 502, 'no-store');
  }
}
