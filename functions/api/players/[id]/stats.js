import { aggregatePlayerStats, recentPlayerForm } from '../../../../live-sports/player-stats.js';

export async function onRequestGet(context) {
  const personId = context.params?.id;
  const namespace = context.env?.PLAYER_HISTORY;
  if (!namespace) {
    return new Response(JSON.stringify({ error: 'PLAYER_HISTORY binding is not configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  if (!personId) {
    return new Response(JSON.stringify({ error: 'Player id is required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const raw = await namespace.get(`player:${personId}:events`);
  let events = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) events = parsed;
    } catch {
      events = [];
    }
  }

  const limit = Math.min(Math.max(Number.parseInt(context.request.url.includes('?') ? new URL(context.request.url).searchParams.get('limit') || '20' : '20', 10) || 20, 1), 100);
  const recent = events.slice(0, limit);

  return new Response(JSON.stringify({
    personId,
    stats: aggregatePlayerStats(recent),
    form: recentPlayerForm(recent, Math.min(limit, 5)),
    events: recent,
  }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=30, stale-while-revalidate=120',
    },
  });
}
