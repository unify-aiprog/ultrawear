/** Cloudflare KV adapter for the provider-neutral durable scheduler. */

import { createDurableScheduler } from './durable-scheduler.js';

export function createKvDurableScheduler(namespace, { now = () => Date.now() } = {}) {
  if (!namespace || typeof namespace.put !== 'function' || typeof namespace.get !== 'function' || typeof namespace.list !== 'function' || typeof namespace.delete !== 'function') {
    throw new TypeError('KV namespace is required');
  }

  const store = {
    put: (key, value) => namespace.put(key, JSON.stringify(value)),
    list: async (prefix) => {
      const values = [];
      let cursor;
      do {
        const page = await namespace.list({ prefix, ...(cursor ? { cursor } : {}) });
        for (const item of page.keys ?? []) {
          const value = await namespace.get(item.name, 'json');
          if (value) values.push(value);
        }
        cursor = page.list_complete ? null : page.cursor;
      } while (cursor);
      return values;
    },
    delete: (key) => namespace.delete(key),
  };

  return createDurableScheduler({ store, now });
}
