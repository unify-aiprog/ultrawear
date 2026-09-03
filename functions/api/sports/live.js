import { createLiveSourceRegistry } from '../../../live-sports/live-source-registry.js';
import { createSportradarSoccerLiveSource } from '../../../live-sports/providers/sportradar-live-source.js';
import { createFootballDataAdapter } from '../../../live-sports/providers/football-data.js';
import { createBigBallsBasketballAdapter } from '../../../live-sports/providers/bigballs-basketball.js';
import { combineSportFeeds, selectLiveSportEvents } from '../../../live-sports/multi-sport-feed.js';

function json(body, status = 200, cache = 'public, max-age=1, stale-while-revalidate=5') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });
}

function createFootballDataLiveSource(env) {
  const token = typeof env.FOOTBALL_DATA_API_TOKEN === 'string' ? env.FOOTBALL_DATA_API_TOKEN.trim() : '';
  if (!token) return null;
  const adapter = createFootballDataAdapter({ token });
  return Object.freeze({
    id: 'football-data-live',
    name: 'football-data.org live',
    sport: 'football',
    async fetch() {
      const payload = await adapter.fetch('/matches?status=IN_PLAY');
      return Array.isArray(payload?.matches) ? payload.matches : [];
    },
    normalize(payload, context = {}) {
      return adapter.normalize(payload, context);
    },
  });
}

function createRegistry(env) {
  const sources = [];
  if (env.SPORTRADAR_API_KEY) sources.push(createSportradarSoccerLiveSource(env));
  const footballData = createFootballDataLiveSource(env);
  if (footballData) sources.push(footballData);
  if (env.BBS_API_KEY) sources.push(createBigBallsBasketballAdapter({ apiKey: env.BBS_API_KEY }));
  return createLiveSourceRegistry({ sources });
}

export async function onRequestGet(context) {
  const observedAt = new Date().toISOString();
  try {
    const registry = createRegistry(context.env);
    if (!registry.list().length) {
      return json({ observedAt, count: 0, sports: [], verified: false, events: [], providers: [], error: 'No live sports provider is configured' }, 503, 'no-store');
    }
    const feeds = await registry.fetchAll({ observedAt });
    const requestedSport = new URL(context.request.url).searchParams.get('sport')?.trim().toLowerCase() || null;
    const events = selectLiveSportEvents(combineSportFeeds(feeds), {
      limit: 50,
      sports: requestedSport ? [requestedSport] : null,
    });
    const providers = feeds.map((feed) => ({
      id: feed.sourceId,
      sport: feed.sport,
      ok: feed.ok !== false,
      count: Array.isArray(feed.events) ? feed.events.length : 0,
      error: feed.ok === false ? feed.error : null,
    }));
    return json({
      observedAt,
      count: events.length,
      sports: [...new Set(events.map((event) => event.sport).filter(Boolean))],
      verified: events.length > 0,
      events,
      providers,
    });
  } catch (error) {
    return json({ observedAt, count: 0, sports: [], verified: false, events: [], error: error instanceof Error ? error.message : String(error) }, 502, 'no-store');
  }
}
