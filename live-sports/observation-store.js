/** Durable KV boundary for source observations. */

function encode(value) {
  return JSON.stringify(value);
}

export function createObservationStore({ put, get, list }) {
  if (typeof put !== 'function' || typeof get !== 'function' || typeof list !== 'function') {
    throw new TypeError('Observation store requires put, get and list functions');
  }

  return Object.freeze({
    async putObservation(observation) {
      if (!observation?.entityId || !observation?.sourceId || !observation?.observedAt) {
        throw new TypeError('Observation is required');
      }
      const key = [
        'observation',
        observation.entityType,
        observation.entityId,
        observation.field,
        observation.observedAt,
        observation.sourceId,
      ].join(':');
      await put(key, encode(observation));
      return observation;
    },

    async listObservations(entityId, field = null) {
      const prefix = field
        ? `observation:event:${entityId}:${field}:`
        : `observation:event:${entityId}:`;
      const keys = await list(prefix);
      const observations = [];
      for (const key of keys) {
        const value = await get(key);
        if (value) observations.push(typeof value === 'string' ? JSON.parse(value) : value);
      }
      return observations.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    },
  });
}

export function createKvObservationStore(namespace) {
  if (!namespace || typeof namespace.put !== 'function' || typeof namespace.get !== 'function' || typeof namespace.list !== 'function') {
    throw new TypeError('KV namespace is required');
  }

  return createObservationStore({
    put: (key, value) => namespace.put(key, value),
    get: (key) => namespace.get(key),
    list: async (prefix) => {
      const keys = [];
      let cursor;
      do {
        const page = await namespace.list({ prefix, cursor });
        keys.push(...page.keys.map((item) => item.name));
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor);
      return keys;
    },
  });
}
