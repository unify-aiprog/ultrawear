/** Durable execution coordinator for continuous ingestion. */

import { nextPollDelay } from './source-health.js';

export function createDurableIngestionCoordinator({ scheduler, ingest, now = () => Date.now(), baseDelay = 30, leaseSeconds = 60 } = {}) {
  if (!scheduler || typeof scheduler.due !== 'function' || typeof scheduler.schedule !== 'function') throw new TypeError('scheduler is required');
  if (typeof ingest !== 'function') throw new TypeError('ingest is required');

  return Object.freeze({
    async runDue(at = now()) {
      const due = await scheduler.due(at);
      const results = [];
      for (const item of due) {
        if (!item?.sourceId) continue;
        const claimed = typeof scheduler.claim === 'function'
          ? await scheduler.claim(item.sourceId, { at, leaseSeconds })
          : true;
        if (!claimed) {
          results.push({ sourceId: item.sourceId, ok: false, claimed: false, skipped: true });
          continue;
        }

        try {
          const result = await ingest(item.sourceId, item.context ?? {});
          const eventStatus = result?.event?.status ?? item.context?.eventStatus ?? 'scheduled';
          const sourceStatus = result?.health?.status ?? (result?.ok ? 'healthy' : 'degraded');
          const delaySeconds = nextPollDelay({
            eventStatus,
            sourceStatus,
            base: item.context?.baseDelay ?? baseDelay,
            minimum: item.context?.minimum ?? 5,
            maximum: item.context?.maximum ?? 3600,
          });
          await scheduler.schedule(item.sourceId, { ...item.context, eventStatus, sourceStatus, lastRunAt: new Date(now()).toISOString(), lastError: result?.ok ? null : (result?.error ?? 'ingestion failed') }, delaySeconds);
          results.push({ sourceId: item.sourceId, ok: Boolean(result?.ok), claimed: true, delaySeconds, result });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await scheduler.schedule(item.sourceId, { ...item.context, sourceStatus: 'degraded', lastRunAt: new Date(now()).toISOString(), lastError: message }, nextPollDelay({ eventStatus: item.context?.eventStatus ?? 'scheduled', sourceStatus: 'degraded', base: item.context?.baseDelay ?? baseDelay }));
          results.push({ sourceId: item.sourceId, ok: false, claimed: true, error: message });
        }
      }
      return results;
    },
  });
}
