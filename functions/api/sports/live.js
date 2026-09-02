import { createSportradarSoccerClient } from '../../../live-sports/providers/sportradar-soccer-client.js';
import { normalizeSportRadarSoccer } from '../../../live-sports/providers/sportradar-soccer.js';
import { createLiveSourceRegistry } from '../../../live-sports/live-source-registry.js';
import { combineSportFeeds, selectLiveSportEvents } from '../../../live-sports/multi-sport-feed.js';

function json(body, status = 200, cache = 'public, max-age=1, stale-while-revalidate=5') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });
}

function items(payload) {
  if (Array.isArray(payload?.summaries)) return payload.summaries;
  if (Array.isArray(payload?.sport_events)) return payload.sport_events;
  return [];
}

function createRegistry(env, observedAt) {
  const client = createSportradarSoccerClient(env);
  return createLiveSourceRegistry({
    sources: [{
      id: 'sportradar-soccer',
      name: 'Sportradar Soccer',
      sport: 'football',
      async fetch() { return items(await client.liveSummaries()); },
      normalize(payload) { return normalizeSportRadarSoccer(payload, { observedAt }); },
    }],
  });
}

export async function onRequestGet(context) {
  const observedAt = new Date().toISOString();
  try {
    const registry = createRegistry(context.env, observedAt);
    const feeds = await registry.fetchAll({ observedAt });
    const events = selectLiveSportEvents(combineSportFeeds(feeds), { limit: 50 });
    return json({
      observedAt,
      count: events.length,
      sports: [...new Set(events.map((event) => event.sport).filter(Boolean))],
      verified: events.length > 0,
      events,
    });
  } catch (error) {
    return json({
      observedAt,
      count: 0,
      sports: [],
      verified: false,
      events: [],
      error: error instanceof Error ? error.message : String(error),
    }, 502, 'no-store');
  }
}
