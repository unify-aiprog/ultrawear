/** Connect ingestion results to deterministic source health tracking. */
import { createSourceHealthTracker } from './source-health.js';

export function createIngestionHealth({ policy, now } = {}) {
  const tracker = createSourceHealthTracker({ policy, now });
  return Object.freeze({
    record(result) {
      return tracker.record({
        sourceId: result?.sourceId,
        eventStatus: result?.event?.status ?? null,
        observedAt: result?.observedAt ?? null,
        ok: result?.ok === true,
        latencyMs: result?.latencyMs ?? null,
        message: result?.error ?? null,
      });
    },
    get: tracker.get,
    list: tracker.list,
  });
}
