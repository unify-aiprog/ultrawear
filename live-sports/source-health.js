/** Deterministic source health and freshness policy. */

import { SOURCE_STATUSES, createSourceHealth } from './adapter.js';

export const DEFAULT_FRESHNESS = Object.freeze({ live: 30, halftime: 60, scheduled: 900, finished: 3600, postponed: 3600, cancelled: 3600 });

function secondsSince(iso, nowMs) {
  const timestamp = Date.parse(iso ?? '');
  return Number.isFinite(timestamp) ? Math.max(0, (nowMs - timestamp) / 1000) : Infinity;
}

export function freshnessWindow(status, policy = DEFAULT_FRESHNESS) {
  return Number(policy[status] ?? policy.scheduled ?? DEFAULT_FRESHNESS.scheduled);
}

export function classifySourceHealth({ status = null, observedAt = null, checkedAt, failures = 0, now = Date.now(), policy = DEFAULT_FRESHNESS }) {
  if (!checkedAt) throw new TypeError('checkedAt is required');
  const age = secondsSince(observedAt, now);
  const checkAge = secondsSince(checkedAt, now);
  const window = freshnessWindow(status, policy);
  if (failures >= 3) return 'offline';
  if (failures > 0) return 'degraded';
  if (age > window * 2 || checkAge > window * 2) return 'stale';
  if (age > window || checkAge > window) return 'degraded';
  return 'healthy';
}

export function createSourceHealthTracker({ policy = DEFAULT_FRESHNESS, now = () => Date.now() } = {}) {
  const state = new Map();
  return Object.freeze({
    record({ sourceId, eventStatus = null, observedAt = null, ok = true, latencyMs = null, message = null, checkedAt = new Date(now()).toISOString() }) {
      if (!sourceId) throw new TypeError('sourceId is required');
      const previous = state.get(sourceId) ?? { failures: 0 };
      const failures = ok ? 0 : previous.failures + 1;
      const status = classifySourceHealth({ status: eventStatus, observedAt, checkedAt, failures, now: now(), policy });
      const health = createSourceHealth({ sourceId, status, checkedAt, observedAt, latencyMs, message });
      state.set(sourceId, { ...health, failures, eventStatus });
      return health;
    },
    restore(health) {
      if (!health?.sourceId) throw new TypeError('sourceId is required');
      state.set(health.sourceId, { ...health, failures: Number(health.failures ?? 0), eventStatus: health.eventStatus ?? null });
      return state.get(health.sourceId);
    },
    get(sourceId) { return state.get(sourceId) ?? null; },
    list() { return [...state.values()]; },
  });
}

export function nextPollDelay({ eventStatus = 'scheduled', sourceStatus = 'healthy', base = 30, minimum = 5, maximum = 3600 } = {}) {
  const eventMultiplier = eventStatus === 'live' ? 0.25 : eventStatus === 'halftime' ? 0.5 : eventStatus === 'scheduled' ? 1 : 2;
  const sourceMultiplier = sourceStatus === 'degraded' ? 2 : sourceStatus === 'stale' ? 1.5 : sourceStatus === 'offline' ? 4 : 1;
  return Math.min(maximum, Math.max(minimum, Math.round(base * eventMultiplier * sourceMultiplier)));
}

export function isSourceStatus(value) { return SOURCE_STATUSES.includes(value); }
