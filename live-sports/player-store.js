import { createPlayer } from './player.js';

const INDEX_KEY = 'players';

export function createPlayerStore({ put, get }) {
  if (typeof put !== 'function') throw new TypeError('Player store put function is required');
  if (typeof get !== 'function') throw new TypeError('Player store get function is required');

  return Object.freeze({
    async put(player) {
      const normalized = createPlayer(player);
      await put(normalized.personId, JSON.stringify(normalized));

      let ids = [];
      const rawIndex = await get(INDEX_KEY);
      if (rawIndex) {
        try {
          const parsed = JSON.parse(rawIndex);
          if (Array.isArray(parsed)) ids = parsed;
        } catch {
          ids = [];
        }
      }
      if (!ids.includes(normalized.personId)) {
        ids.push(normalized.personId);
        ids.sort();
        await put(INDEX_KEY, JSON.stringify(ids));
      }

      return normalized;
    },
    async get(personId) {
      const normalizedId = typeof personId === 'string' ? personId.trim() : '';
      if (!normalizedId) return null;
      const value = await get(normalizedId);
      if (!value) return null;
      return createPlayer(JSON.parse(value));
    },
    async list() {
      const rawIndex = await get(INDEX_KEY);
      if (!rawIndex) return [];
      try {
        const parsed = JSON.parse(rawIndex);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    },
  });
}

export function createKvPlayerStore(namespace) {
  if (!namespace || typeof namespace.get !== 'function' || typeof namespace.put !== 'function') {
    throw new TypeError('A KV namespace is required');
  }
  return createPlayerStore(namespace);
}
