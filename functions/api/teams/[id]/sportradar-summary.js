import { createSportradarSoccerClient } from '../../../../live-sports/providers/sportradar-soccer-client.js';

function json(body, status = 200, cache = 'public, max-age=300, stale-while-revalidate=600') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });
}

export async function onRequestGet(context) {
  const competitorId = typeof context.params?.id === 'string' ? context.params.id.trim() : '';
  if (!competitorId) return json({ error: 'Competitor id is required' }, 400, 'no-store');
  try {
    const payload = await createSportradarSoccerClient(context.env).competitorSummaries(competitorId);
    return json({ source: 'Sportradar', feed: 'soccer-competitor-summaries', competitorId, observedAt: new Date().toISOString(), data: payload });
  } catch (error) {
    return json({ source: 'Sportradar', feed: 'soccer-competitor-summaries', competitorId, error: error instanceof Error ? error.message : String(error) }, 502, 'no-store');
  }
}
