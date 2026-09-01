/** Deterministic freshness checks for live-event rendering. */

export const DEFAULT_MAX_AGE_MS = Object.freeze({
  scheduled: 24 * 60 * 60 * 1000,
  live: 2 * 60 * 1000,
  halftime: 5 * 60 * 1000,
  finished: 60 * 60 * 1000,
  postponed: 24 * 60 * 60 * 1000,
  cancelled: 24 * 60 * 60 * 1000,
});

export function getEventAgeMs(event, now = new Date()) {
  if (!event?.updatedAt) return Infinity;
  const updated = Date.parse(event.updatedAt);
  const current = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(updated) || !Number.isFinite(current)) return Infinity;
  return Math.max(0, current - updated);
}

export function isEventFresh(event, now = new Date(), maxAgeMs = DEFAULT_MAX_AGE_MS) {
  const threshold = maxAgeMs[event?.status] ?? DEFAULT_MAX_AGE_MS.scheduled;
  return getEventAgeMs(event, now) <= threshold;
}

export function getFreshness(event, now = new Date(), maxAgeMs = DEFAULT_MAX_AGE_MS) {
  const ageMs = getEventAgeMs(event, now);
  const threshold = maxAgeMs[event?.status] ?? DEFAULT_MAX_AGE_MS.scheduled;
  return { ageMs, thresholdMs: threshold, fresh: ageMs <= threshold };
}
