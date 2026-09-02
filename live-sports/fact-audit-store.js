/** Durable KV boundary for canonical fact audit records. */

export function createFactAuditStore({ put, get, list } = {}) {
  if (typeof put !== 'function' || typeof get !== 'function' || typeof list !== 'function') {
    throw new TypeError('Fact audit store requires put, get and list functions');
  }

  return Object.freeze({
    async putAudit(record) {
      if (!record?.id || !record?.entityId || !record?.observedAt) throw new TypeError('Audit record is required');
      await put(record.id, JSON.stringify(record));
      return record;
    },
    async getAudit(id) {
      if (!id) return null;
      const value = await get(id);
      return typeof value === 'string' ? JSON.parse(value) : value;
    },
    async listAudits({ entityId = null, field = null } = {}) {
      const keys = await list('fact-audit:');
      const records = [];
      for (const key of keys) {
        const value = await get(key);
        const record = typeof value === 'string' ? JSON.parse(value) : value;
        if (record && (!entityId || record.entityId === entityId) && (!field || record.field === field)) records.push(record);
      }
      return records.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    },
  });
}

export function createKvFactAuditStore(namespace) {
  if (!namespace || typeof namespace.put !== 'function' || typeof namespace.get !== 'function' || typeof namespace.list !== 'function') {
    throw new TypeError('KV namespace is required');
  }
  return createFactAuditStore({
    put: (key, value) => namespace.put(key, value),
    get: (key) => namespace.get(key),
    list: async (prefix) => {
      const keys = [];
      let cursor;
      do {
        const page = await namespace.list({ prefix, ...(cursor ? { cursor } : {}) });
        keys.push(...(page.keys ?? []).map((item) => item.name));
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor);
      return keys;
    },
  });
}
