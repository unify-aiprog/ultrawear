import { createKvPlayerStore } from '../../../live-sports/player-store.js';
import { rankPlayersToWatch } from '../../../live-sports/player-discovery.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=30, stale-while-revalidate=120',
    },
  });
}

export async function onRequestGet(context) {
  const playerNamespace = context.env?.PLAYER_STORE;
  const historyNamespace = context.env?.PLAYER_HISTORY;
  const eventIndex = context.env?.EVENT_INDEX;

  if (!playerNamespace || !historyNamespace || !eventIndex) {
    return json({ error: 'PLAYER_STORE, PLAYER_HISTORY, and EVENT_INDEX bindings are required' }, 503);
  }

  const players = createKvPlayerStore(playerNamespace);
  const ids = await players.list();
  const rawEvents = await eventIndex.get('events');
  let upcomingEvents = [];
  if (rawEvents) {
    try {
      const parsed = JSON.parse(rawEvents);
      if (Array.isArray(parsed)) upcomingEvents = parsed;
    } catch {
      upcomingEvents = [];
    }
  }

  const candidates = [];
  for (const personId of ids) {
    const player = await players.get(personId);
    if (!player) continue;
    const rawHistory = await historyNamespace.get(`player:${personId}:events`);
    let history = [];
    if (rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) history = parsed;
      } catch {
        history = [];
      }
    }
    candidates.push({ personId, player, history, upcomingEvents });
  }

  const url = new URL(context.request.url);
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 50);
  return json({
    generatedAt: new Date().toISOString(),
    players: rankPlayersToWatch(candidates).slice(0, limit),
  });
}
