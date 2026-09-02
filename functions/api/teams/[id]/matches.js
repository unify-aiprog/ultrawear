export async function onRequestGet(context) {
  const teamId = context.params?.id;
  const namespace = context.env?.TEAM_HISTORY;

  if (!namespace) {
    return new Response(JSON.stringify({ error: 'Team history store is not configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }

  if (!teamId) {
    return new Response(JSON.stringify({ error: 'Team id is required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const matches = await namespace.get(`team:${teamId}:matches`, 'json');
  return new Response(JSON.stringify({ teamId, matches: Array.isArray(matches) ? matches : [] }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=30, stale-while-revalidate=120',
    },
  });
}
