import { createTrendStore } from '../../live-sports/trend-store.js';

function json(body, status = 200, cache = 'public, max-age=15, stale-while-revalidate=60') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': cache },
  });
}

export async function onRequestGet(context) {
  const namespace = context.env?.TRENDING_STORE;
  if (!namespace) return json({ error: 'TRENDING_STORE binding is not configured' }, 503, 'no-store');
  const url = new URL(context.request.url);
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get('limit') || '5', 10) || 5, 1), 10);
  return json({ items: await createTrendStore(namespace).list(limit) });
}

export async function onRequestPost(context) {
  const namespace = context.env?.TRENDING_STORE;
  if (!namespace) return json({ error: 'TRENDING_STORE binding is not configured' }, 503, 'no-store');

  let body;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, 'no-store'); }
  const entityId = typeof body?.entityId === 'string' ? body.entityId.trim() : '';
  if (!entityId || entityId.length > 160) return json({ error: 'Valid entityId is required' }, 400, 'no-store');

  const entityType = typeof body?.entityType === 'string' ? body.entityType.trim().slice(0, 40) : 'entity';
  const label = typeof body?.label === 'string' ? body.label.trim().slice(0, 160) : entityId;
  const item = await createTrendStore(namespace).record({ entityId, entityType, label });
  return json({ ok: true, item }, 202, 'no-store');
}
