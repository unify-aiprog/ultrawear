export async function onRequestGet({ params, env }) {
  const personId = typeof params?.id === 'string' ? params.id.trim() : '';
  if (!personId) {
    return Response.json({ error: 'Player id is required' }, { status: 400 });
  }

  if (!env?.PLAYER_HISTORY) {
    return Response.json({ error: 'Player history is not configured' }, { status: 503 });
  }

  const raw = await env.PLAYER_HISTORY.get(`player:${personId}:events`);
  let events = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      events = Array.isArray(parsed) ? parsed : [];
    } catch {
      return Response.json({ error: 'Stored player history is invalid' }, { status: 500 });
    }
  }

  return Response.json(
    { personId, events },
    { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } },
  );
}
