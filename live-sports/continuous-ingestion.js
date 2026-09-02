/** Deterministic scheduler for continuous source polling. */

import { nextPollDelay } from './source-health.js';

export function createContinuousIngestionScheduler({ ingest, now = () => Date.now(), baseDelay = 30, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  if (typeof ingest !== 'function') throw new TypeError('ingest is required');
  const timers = new Map();
  let stopped = false;

  const schedule = (sourceId, context = {}) => {
    if (stopped) return null;
    const delaySeconds = nextPollDelay({
      eventStatus: context.eventStatus ?? 'scheduled', sourceStatus: context.sourceStatus ?? 'healthy',
      base: context.baseDelay ?? baseDelay, minimum: context.minimum ?? 5, maximum: context.maximum ?? 3600,
    });
    const timer = setTimer(async () => {
      timers.delete(sourceId);
      if (stopped) return;
      try {
        const result = await ingest(sourceId, context);
        schedule(sourceId, { ...context, eventStatus: result?.event?.status ?? context.eventStatus, sourceStatus: result?.health?.status ?? context.sourceStatus, lastRunAt: new Date(now()).toISOString() });
      } catch (error) {
        schedule(sourceId, { ...context, sourceStatus: 'degraded', lastError: error instanceof Error ? error.message : String(error) });
      }
    }, delaySeconds * 1000);
    timers.set(sourceId, timer);
    return delaySeconds;
  };

  return Object.freeze({
    start(sources = []) { sources.forEach(({ sourceId, ...context }) => schedule(sourceId, context)); return sources.length; },
    stop() { stopped = true; for (const timer of timers.values()) clearTimer(timer); timers.clear(); },
    pending() { return timers.size; },
  });
}
