/**
 * Persistent player-to-event catalogue.
 *
 * This intentionally stores links to canonical event IDs rather than copying
 * whole events, keeping the sports graph normalized and allowing live events
 * to remain the source of truth.
 */

function clean(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function summary(event, personId, performance = null) {
  const normalizedPersonId = clean(personId);
  if (!normalizedPersonId) throw new TypeError('Player personId is required');
  if (!event?.id) throw new TypeError('Event id is required');

  return {
    eventId: event.id,
    personId: normalizedPersonId,
    sport: event.sport || null,
    competition: event.competition || null,
    startsAt: event.startsAt || null,
    status: event.status || null,
    teamId: performance?.teamId || null,
    opponentId: performance?.opponentId || null,
    role: performance?.role || null,
    started: performance?.started === true,
    minutes: performance?.minutes ?? null,
    stats: performance?.stats || {},
    updatedAt: event.updatedAt || null,
  };
}

export function createPlayerHistoryStore(namespace) {
  if (!namespace || typeof namespace.get !== 'function' || typeof namespace.put !== 'function') {
    throw new TypeError('A KV namespace is required');
  }

  const key = (personId) => `player:${clean(personId)}:events`;

  return Object.freeze({
    async list(personId) {
      const normalizedId = clean(personId);
      if (!normalizedId) return [];
      const raw = await namespace.get(key(normalizedId));
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },

    async put(event, personId, performance = null) {
      const normalizedId = clean(personId);
      if (!normalizedId) throw new TypeError('Player personId is required');
      const next = summary(event, normalizedId, performance);
      const existing = await this.list(normalizedId);
      const merged = [
        ...existing.filter((item) => item.eventId !== next.eventId),
        next,
      ].sort((a, b) => String(b.startsAt || '').localeCompare(String(a.startsAt || '')));
      await namespace.put(key(normalizedId), JSON.stringify(merged));
      return next;
    },
  });
}
