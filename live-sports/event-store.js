/** Persistence boundary for normalized canonical sports events. */

export function createEventStore({ put, get, list = null }) {
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
    async listEvents() {
      if (typeof list !== 'function') return [];
      const events = await list();
      return Array.isArray(events) ? events : [];
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
    list: async () => {
      const events = [];
      let cursor;
      do {
        const page = await namespace.list({ cursor });
        for (const item of page.keys) {
          const event = await namespace.get(item.name, 'json');
          if (event?.id) events.push(event);
        }
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor);
      return events;
    },
  });
}
