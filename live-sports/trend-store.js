const KEY = 'trending:entities';
const MAX_ITEMS = 100;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalize(raw) {
  if (!Array.isArray(raw)) return [];
  const cutoff = Date.now() - WINDOW_MS;
  return raw
    .filter((item) => item && clean(item.entityId) && Number.isFinite(item.count) && Number.isFinite(item.updatedAt) && item.updatedAt >= cutoff)
    .map((item) => ({
      entityId: clean(item.entityId),
      entityType: clean(item.entityType) || 'entity',
      label: clean(item.label) || clean(item.entityId),
      count: Math.max(0, Math.floor(item.count)),
      updatedAt: item.updatedAt,
    }))
    .slice(0, MAX_ITEMS);
}

export function createTrendStore(namespace) {
  if (!namespace || typeof namespace.get !== 'function' || typeof namespace.put !== 'function') {
    throw new TypeError('A KV namespace is required');
  }

  return Object.freeze({
    async list(limit = 5) {
      let rows = [];
      const raw = await namespace.get(KEY);
      if (raw) {
        try { rows = normalize(JSON.parse(raw)); } catch { rows = []; }
      }
      return rows.sort((a, b) => b.count - a.count || b.updatedAt - a.updatedAt).slice(0, Math.min(20, Math.max(1, limit)));
    },

    async record({ entityId, entityType = 'entity', label = entityId }) {
      const id = clean(entityId);
      if (!id) throw new TypeError('entityId is required');
      const now = Date.now();
      const existing = await this.list(MAX_ITEMS);
      const found = existing.find((item) => item.entityId === id);
      const next = {
        entityId: id,
        entityType: clean(entityType) || 'entity',
        label: clean(label) || id,
        count: (found?.count || 0) + 1,
        updatedAt: now,
      };
      const merged = [next, ...existing.filter((item) => item.entityId !== id)].sort((a, b) => b.count - a.count || b.updatedAt - a.updatedAt).slice(0, MAX_ITEMS);
      await namespace.put(KEY, JSON.stringify(merged), { expirationTtl: Math.ceil(WINDOW_MS / 1000) });
      return next;
    },
  });
}
