import { createKvFactAuditStore } from '../../../../live-sports/fact-audit-store.js';
import { createVerificationHistory } from '../../../../live-sports/verification-history.js';

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

function parseLimit(value) {
  const parsed = Number.parseInt(value ?? '100', 10);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(500, Math.max(1, parsed));
}

export async function onRequestGet({ params, env, request }) {
  const id = decodeURIComponent(params.id || '').trim();
  if (!id) return json({ error: 'Event id is required' }, 400, { 'cache-control': 'no-store' });

  const namespace = env.FACT_AUDIT || env.OBSERVATION_STORE;
  if (!namespace) return json({ error: 'Fact audit store is not configured' }, 503, { 'cache-control': 'no-store' });

  const url = new URL(request.url);
  const field = url.searchParams.get('field')?.trim() || null;
  const limit = parseLimit(url.searchParams.get('limit'));
  const history = createVerificationHistory({ auditStore: createKvFactAuditStore(namespace) });
  const records = await history.forEvent(id, { field, limit });

  return json({ eventId: id, field, limit, records }, 200, {
    'cache-control': 'public, max-age=30, stale-while-revalidate=120',
  });
}
