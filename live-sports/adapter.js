/** Provider-neutral contract for ingesting trusted sports data. */

export const SOURCE_STATUSES = Object.freeze(['healthy', 'degraded', 'stale', 'offline']);

export function createSourceAdapter({ id, name, sport = null, normalize, health = null }) {
  if (!id || !name || typeof normalize !== 'function') throw new TypeError('Invalid sports source adapter');
  return Object.freeze({ id, name, sport, normalize, health });
}

export function normalizeSourceEvent(adapter, payload, context = {}) {
  if (!adapter || typeof adapter.normalize !== 'function') throw new TypeError('Adapter is required');
  const event = adapter.normalize(payload, context);
  if (!event || !event.id || !event.startsAt) throw new TypeError('Adapter returned an invalid event');
  return event;
}

export function createSourceHealth({ sourceId, status = 'healthy', checkedAt, observedAt = null, latencyMs = null, message = null }) {
  if (!sourceId || !checkedAt || !SOURCE_STATUSES.includes(status)) throw new TypeError('Invalid source health');
  return { sourceId, status, checkedAt, observedAt, latencyMs, message };
}
