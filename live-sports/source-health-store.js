/** Durable KV boundary for source health and revalidation state. */

export function createSourceHealthStore({ put, get, list = null, remove = null } = {}) {
  if (typeof put !== 'function' || typeof get !== 'function') {
    throw new TypeError('Source health store requires put and get functions');
  }

  return Object.freeze({
    async putHealth(health) {
      if (!health?.sourceId) throw new TypeError('sourceId is required');
      await put(`source-health:${health.sourceId}`, health);
      return health;
    },
    async getHealth(sourceId) {
      if (!sourceId) return null;
      return get(`source-health:${sourceId}`);
    },
    async listHealth() {
      if (typeof list !== 'function') return [];
      const values = await list('source-health:');
      return Array.isArray(values) ? values : [];
    },
    async putRevalidation(item) {
      if (!item?.sourceId) throw new TypeError('sourceId is required');
      await put(`revalidation:${item.sourceId}`, item);
      return item;
    },
    async getRevalidation(sourceId) {
      if (!sourceId) return null;
      return get(`revalidation:${sourceId}`);
    },
    async listRevalidations() {
      if (typeof list !== 'function') return [];
      const values = await list('revalidation:');
      return Array.isArray(values) ? values : [];
    },
    async deleteRevalidation(sourceId) {
      if (!sourceId) throw new TypeError('sourceId is required');
      if (typeof remove !== 'function') throw new TypeError('remove is required');
      await remove(`revalidation:${sourceId}`);
    },
  });
}

export function createKvSourceHealthStore(namespace) {
  if (!namespace || typeof namespace.put !== 'function' || typeof namespace.get !== 'function' || typeof namespace.delete !== 'function') {
    throw new TypeError('KV namespace is required');
  }

  return createSourceHealthStore({
    put: (key, value) => namespace.put(key, JSON.stringify(value)),
    get: (key) => namespace.get(key, 'json'),
    list: async (prefix) => {
      const values = [];
      let cursor;
      do {
        const page = await namespace.list({ prefix, cursor });
        for (const item of page.keys) {
          const value = await namespace.get(item.name, 'json');
          if (value) values.push(value);
        }
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor);
      return values;
    },
    remove: (key) => namespace.delete(key),
  });
}
