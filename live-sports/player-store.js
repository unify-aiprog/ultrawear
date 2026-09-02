import { createPlayer } from './player.js';

export function createPlayerStore({ put, get }) {
  if (typeof put !== 'function') throw new TypeError('Player store put function is required');
  if (typeof get !== 'function') throw new TypeError('Player store get function is required');

  return Object.freeze({
    async put(player) {
      const normalized = createPlayer(player);
      await put(normalized.personId, JSON.stringify(normalized));
      return normalized;
    },
    async get(personId) {
      const normalizedId = typeof personId === 'string' ? personId.trim() : '';
      if (!normalizedId) return null;
      const value = await get(normalizedId);
      if (!value) return null;
      return createPlayer(JSON.parse(value));
    },
  });
}

export function createKvPlayerStore(namespace) {
  if (!namespace || typeof namespace.get !== 'function' || typeof namespace.put !== 'function') {
    throw new TypeError('A KV namespace is required');
  }
  return createPlayerStore(namespace);
}
