import { createSportradarSoccerClient } from '../../../live-sports/providers/sportradar-soccer-client.js';
import { normalizeSportRadarSoccer } from '../../../live-sports/providers/sportradar-soccer.js';
import { combineSportFeeds } from '../../../live-sports/multi-sport-feed.js';

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

export async function onRequestGet(context) {
  const observedAt = new Date().toISOString();
  try {
    const payload = await createSportradarSoccerClient(context.env).liveSummaries();
    const soccer = items(payload).map((item) => {
      try { return normalizeSportRadarSoccer(item, { observedAt }); } catch { return null; }
    }).filter(Boolean);
    const events = combineSportFeeds([{ events: soccer, sport: 'Football', sourceId: 'soccer-live' }]);
    return json({ observedAt, count: events.length, sports: [...new Set(events.map((event) => event.sport).filter(Boolean))], verified: events.length > 0, events });
  } catch (error) {
    return json({ observedAt, count: 0, sports: [], verified: false, events: [], error: error instanceof Error ? error.message : String(error) }, 502, 'no-store');
  }
}
