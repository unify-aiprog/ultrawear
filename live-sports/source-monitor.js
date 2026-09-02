/** Source freshness/health policy. Pure functions only; scheduling/network lives outside the core. */
import { createSourceHealth } from './adapter.js';
import { getFreshness } from './freshness.js';

export function assessSource({ sourceId, checkedAt, observedAt, event = null, latencyMs = null, error = null, now = Date.now() }) {
  if (!sourceId || !checkedAt) throw new TypeError('sourceId and checkedAt are required');
  if (error) return createSourceHealth({ sourceId, status: 'offline', checkedAt, observedAt, latencyMs, message: String(error.message ?? error) });
  if (!observedAt) return createSourceHealth({ sourceId, status: 'degraded', checkedAt, observedAt: null, latencyMs, message: 'Source responded without an observation timestamp' });
  if (!event) return createSourceHealth({ sourceId, status: 'degraded', checkedAt, observedAt, latencyMs, message: 'Source responded without a normalized event' });

  const freshness = getFreshness(event, now);
  const status = freshness.fresh ? 'healthy' : 'stale';
  return createSourceHealth({ sourceId, status, checkedAt, observedAt, latencyMs, message: freshness.fresh ? null : `Event data is ${freshness.ageMs}ms old` });
}

export function shouldSurfaceEvent(event, now = Date.now()) {
  return Boolean(event && getFreshness(event, now).fresh);
}
