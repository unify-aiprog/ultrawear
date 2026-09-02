export async function onRequestGet({ params, env }) {
  const personId = typeof params?.id === 'string' ? params.id.trim() : '';
  if (!personId) {
    return Response.json({ error: 'Player id is required' }, { status: 400 });
  }

  if (!env?.PERSON_STORE || !env?.PLAYER_STORE) {
    return Response.json({ error: 'Player stores are not configured' }, { status: 503 });
  }

  const [personRaw, playerRaw] = await Promise.all([
    env.PERSON_STORE.get(personId),
    env.PLAYER_STORE.get(personId),
  ]);

  if (!personRaw || !playerRaw) {
    return Response.json({ error: 'Player not found' }, { status: 404 });
  }

  let person;
  let player;
  try {
    person = JSON.parse(personRaw);
    player = JSON.parse(playerRaw);
  } catch {
    return Response.json({ error: 'Stored player data is invalid' }, { status: 500 });
  }

  return Response.json(
    { person, player },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
