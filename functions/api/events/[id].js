/**
 * Cloudflare Pages Function: canonical event lookup.
 *
 * EVENT_STORE is a KV namespace containing normalized event JSON keyed by canonical
 * event id. The ingestion worker is responsible for writing snapshots after provider
 * normalization; the browser never talks to the sports provider directly.
 */

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export async function onRequestGet({ params, env }) {
  const id = decodeURIComponent(params.id || '').trim();
  if (!id) return json({ error: 'Event id is required' }, 400);

  if (!env.EVENT_STORE) {
    return json({ error: 'Event store is not configured' }, 503, { 'cache-control': 'no-store' });
  }

  const event = await env.EVENT_STORE.get(id, 'json');
  if (!event) return json({ error: 'Event not found' }, 404, { 'cache-control': 'no-store' });

  return json({ event }, 200, {
    'cache-control': event.status === 'live' || event.status === 'halftime'
      ? 'public, max-age=5, stale-while-revalidate=15'
      : 'public, max-age=60, stale-while-revalidate=300',
  });
}
