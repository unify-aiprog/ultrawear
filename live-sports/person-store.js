/**
 * Persistent sport-neutral person catalogue.
 *
 * The store is intentionally independent from player/manager UI so the same
 * person identity can be reused across every sport role and career phase.
 */

import { createPerson } from './person.js';

export function createPersonStore({ put, get }) {
  if (typeof put !== 'function') throw new TypeError('Person store put function is required');
  if (typeof get !== 'function') throw new TypeError('Person store get function is required');
  return Object.freeze({
    async put(person) {
      const normalized = createPerson(person);
      await put(normalized.id, JSON.stringify(normalized));
      return normalized;
    },
    async get(id) {
      const normalizedId = typeof id === 'string' ? id.trim() : '';
      if (!normalizedId) return null;
      const value = await get(normalizedId);
      if (!value) return null;
      return createPerson(JSON.parse(value));
    },
  });
}

export function createKvPersonStore(namespace) {
  if (!namespace || typeof namespace.get !== 'function' || typeof namespace.put !== 'function') {
    throw new TypeError('A KV namespace is required');
  }
  return createPersonStore(namespace);
}
