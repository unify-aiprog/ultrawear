/** Server-side ingestion orchestration for verified live sports sources. */

import { createSourceHealth } from './adapter.js';

export function createIngestionRunner({ registry, fetchSource, eventStore = null, now = () => new Date().toISOString() }) {
  if (!registry || typeof registry.ingest !== 'function') throw new TypeError('Registry is required');
  if (typeof fetchSource !== 'function') throw new TypeError('fetchSource is required');
  if (eventStore && typeof eventStore.putEvent !== 'function') throw new TypeError('eventStore.putEvent is required');

  return async function ingest(sourceId, requestContext = {}) {
    const startedAt = Date.now();
    const observedAt = now();
    try {
      const payload = await fetchSource({ sourceId, ...requestContext });
      const result = registry.ingest(sourceId, payload, { ...requestContext, observedAt });
      if (eventStore && result.event && result.changed) await eventStore.putEvent(result.event);
      return {
        ok: true,
        sourceId,
        observedAt,
        latencyMs: Date.now() - startedAt,
        ...result,
        health: createSourceHealth({
          sourceId,
          status: 'healthy',
          checkedAt: now(),
          observedAt,
          latencyMs: Date.now() - startedAt,
        }),
      };
    } catch (error) {
      return {
        ok: false,
        sourceId,
        observedAt,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
        health: createSourceHealth({
          sourceId,
          status: 'offline',
          checkedAt: now(),
          observedAt,
          latencyMs: Date.now() - startedAt,
        }),
      };
    }
  };
}
