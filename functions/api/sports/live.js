import { createLiveSourceRegistry } from '../../../live-sports/live-source-registry.js';
import { createSportradarSoccerLiveSource } from '../../../live-sports/providers/sportradar-live-source.js';
import { createBigBallsBasketballAdapter } from '../../../live-sports/providers/bigballs-basketball.js';
import { combineSportFeeds, selectLiveSportEvents } from '../../../live-sports/multi-sport-feed.js';

function json(body, status = 200, cache = 'public, max-age=1, stale-while-revalidate=5') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });
}

function createRegistry(env) {
  const basketball = env.BBS_API_KEY ? createBigBallsBasketballAdapter({ apiKey: env.BBS_API_KEY }) : null;
  return createLiveSourceRegistry({
    sources: [
      createSportradarSoccerLiveSource(env),
      basketball,
    ].filter(Boolean),
  });
}

export async function onRequestGet(context) {
  const observedAt = new Date().toISOString();
  try {
    const registry = createRegistry(context.env);
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
