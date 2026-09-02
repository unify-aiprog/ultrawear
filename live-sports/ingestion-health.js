/** Connect ingestion results to deterministic source health tracking. */
import { createSourceHealthTracker } from './source-health.js';

export function createIngestionHealth({ policy, now, store = null } = {}) {
  const tracker = createSourceHealthTracker({ policy, now });
  const record = (result) => {
    const health = tracker.record({
      sourceId: result?.sourceId,
      eventStatus: result?.event?.status ?? null,
      observedAt: result?.observedAt ?? null,
      ok: result?.ok === true,
      latencyMs: result?.latencyMs ?? null,
      message: result?.error ?? null,
    });
    if (!store) return health;
    return store.putHealth({ ...health, failures: tracker.get(result?.sourceId)?.failures ?? 0, eventStatus: result?.event?.status ?? null });
  };

  return Object.freeze({
    record,
    async hydrate() {
      if (!store || typeof store.listHealth !== 'function') return 0;
      const persisted = await store.listHealth();
      for (const health of persisted) {
        if (!health?.sourceId) continue;
        tracker.restore?.(health);
      }
      return persisted.length;
    },
    get: tracker.get,
    list: tracker.list,
  });
}
