const KEY = 'trending:entities';
const MAX_ITEMS = 100;
const WINDOW_MS = 24 * 60 * 60 * 1000;

const SIGNAL_WEIGHTS = Object.freeze({
  view: 1,
  search: 2,
  follow: 3,
  watch: 3,
  live: 4,
});

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSignal(value) {
  const signal = clean(value).toLowerCase();
  return Object.prototype.hasOwnProperty.call(SIGNAL_WEIGHTS, signal) ? signal : 'view';
}

function normalize(raw) {
  if (!Array.isArray(raw)) return [];
  const cutoff = Date.now() - WINDOW_MS;
  return raw
    .filter((item) => item && clean(item.entityId) && Number.isFinite(item.score) && Number.isFinite(item.count) && Number.isFinite(item.updatedAt) && item.updatedAt >= cutoff)
    .map((item) => ({
      entityId: clean(item.entityId),
      entityType: clean(item.entityType) || 'entity',
      label: clean(item.label) || clean(item.entityId),
      count: Math.max(0, Math.floor(item.count)),
      score: Math.max(0, Number(item.score)),
      lastSignal: normalizeSignal(item.lastSignal),
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
      return rows
        .sort((a, b) => b.score - a.score || b.count - a.count || b.updatedAt - a.updatedAt)
        .slice(0, Math.min(20, Math.max(1, limit)));
    },

    async record({ entityId, entityType = 'entity', label = entityId, signal = 'view' }) {
      const id = clean(entityId);
      if (!id) throw new TypeError('entityId is required');
      const normalizedSignal = normalizeSignal(signal);
      const weight = SIGNAL_WEIGHTS[normalizedSignal];
      const now = Date.now();
      const existing = await this.list(MAX_ITEMS);
      const found = existing.find((item) => item.entityId === id);
      const next = {
        entityId: id,
        entityType: clean(entityType) || 'entity',
        label: clean(label) || id,
        count: (found?.count || 0) + 1,
        score: (found?.score || 0) + weight,
        lastSignal: normalizedSignal,
        updatedAt: now,
      };
      const merged = [next, ...existing.filter((item) => item.entityId !== id)]
        .sort((a, b) => b.score - a.score || b.count - a.count || b.updatedAt - a.updatedAt)
        .slice(0, MAX_ITEMS);
      await namespace.put(KEY, JSON.stringify(merged), { expirationTtl: Math.ceil(WINDOW_MS / 1000) });
      return next;
    },
  });
}
