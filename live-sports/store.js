import { getFreshness } from './freshness.js';

const TERMINAL_STATUSES = new Set(['finished', 'cancelled', 'postponed']);

function cloneEvent(event) {
  return event == null ? null : structuredClone(event);
}

function versionFor(event, version, recordedAt) {
  return Object.freeze({
    version,
    recordedAt,
    event: cloneEvent(event),
  });
}

export function createEventStore({ now = () => new Date().toISOString(), maxHistory = 20 } = {}) {
  if (!Number.isInteger(maxHistory) || maxHistory < 1) throw new TypeError('maxHistory must be a positive integer');
  const events = new Map();
  const history = new Map();

  function remove(id) {
    const existed = events.delete(id);
    history.delete(id);
    return existed;
  }

  return Object.freeze({
    upsert(event, recordedAt = now()) {
      if (!event?.id) throw new TypeError('Event id is required');
      if (!event.startsAt) throw new TypeError('Event startsAt is required');
      const previous = events.get(event.id) ?? null;
      const version = (history.get(event.id)?.at(-1)?.version ?? 0) + 1;
      const next = cloneEvent({ ...event, updatedAt: event.updatedAt ?? recordedAt });
      events.set(event.id, next);
      const versions = history.get(event.id) ?? [];
      versions.push(versionFor(next, version, recordedAt));
      if (versions.length > maxHistory) versions.splice(0, versions.length - maxHistory);
      history.set(event.id, versions);
      return Object.freeze({ event: cloneEvent(next), previous: cloneEvent(previous), version, changed: JSON.stringify(previous) !== JSON.stringify(next) });
    },

    get(id) {
      return cloneEvent(events.get(id) ?? null);
    },

    getHistory(id) {
      return (history.get(id) ?? []).map(cloneEvent);
    },

    list({ now: observedAt = now(), freshOnly = false, includeTerminal = true } = {}) {
      return [...events.values()]
        .filter((event) => includeTerminal || !TERMINAL_STATUSES.has(event.status))
        .filter((event) => !freshOnly || getFreshness(event, observedAt).fresh)
        .map(cloneEvent);
    },

    remove,

    prune({ now: observedAt = now(), maxAgeMs = 86400000 } = {}) {
      if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) throw new TypeError('maxAgeMs must be non-negative');
      let removed = 0;
      const observedMs = Date.parse(observedAt);
      if (!Number.isFinite(observedMs)) throw new TypeError('Invalid observedAt');
      for (const event of events.values()) {
        const updated = Date.parse(event.updatedAt ?? event.startsAt);
        if (Number.isFinite(updated) && observedMs - updated > maxAgeMs && remove(event.id)) removed += 1;
      }
      return removed;
    },
  });
}
