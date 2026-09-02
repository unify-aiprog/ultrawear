/** Persistence boundary for normalized canonical sports events. */

export function createEventStore({ put, get }) {
  if (typeof put !== 'function' || typeof get !== 'function') {
    throw new TypeError('Event store requires put and get functions');
  }

  return Object.freeze({
    async putEvent(event) {
      if (!event?.id) throw new TypeError('Event is required');
      await put(event.id, event);
      return event;
    },
    async getEvent(id) {
      if (!id) return null;
      return get(id);
    },
  });
}

export function createKvEventStore(namespace) {
  if (!namespace || typeof namespace.put !== 'function' || typeof namespace.get !== 'function') {
    throw new TypeError('KV namespace is required');
  }

  return createEventStore({
    put: (id, event) => namespace.put(id, JSON.stringify(event)),
    get: (id) => namespace.get(id, 'json'),
  });
}
