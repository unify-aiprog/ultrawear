/** Cloudflare Pages Function: list published canonical events for the homepage. */

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export async function onRequestGet({ env }) {
  if (!env.EVENT_INDEX) {
    return json({ error: 'Event index is not configured' }, 503, { 'cache-control': 'no-store' });
  }

  const events = await env.EVENT_INDEX.get('events', 'json');
  return json({ events: Array.isArray(events) ? events : [] }, 200, {
    'cache-control': 'public, max-age=10, stale-while-revalidate=30',
  });
}
