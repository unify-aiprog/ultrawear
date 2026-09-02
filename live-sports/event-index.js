/** Maintain a compact index of canonical event identities in KV. */

export function createEventIndexStore(namespace) {
  if (!namespace || typeof namespace.get !== 'function' || typeof namespace.put !== 'function') {
    throw new TypeError('Event index KV namespace is required');
  }

  return Object.freeze({
    async list() {
      const value = await namespace.get('events', 'json');
      return Array.isArray(value) ? value : [];
    },
    async put(event) {
      if (!event?.id) throw new TypeError('Event is required');
      const events = await this.list();
      const next = events.filter((item) => item.id !== event.id);
      next.push({
        id: event.id,
        sport: event.sport,
        competition: event.competition,
        home: event.home,
        away: event.away,
        startsAt: event.startsAt,
        status: event.status,
        score: event.score ?? null,
        updatedAt: event.updatedAt ?? null,
      });
      next.sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
      await namespace.put('events', JSON.stringify(next));
      return event;
    },
  });
}
