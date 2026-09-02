/** Deterministic revalidation queue with optional durable state. */
export function createRevalidationQueue({ ingest, now = () => Date.now(), store = null } = {}) {
  if (typeof ingest !== 'function') throw new TypeError('ingest is required');
  const pending = new Map();

  const hydrate = async () => {
    if (!store?.listRevalidations) return 0;
    const items = await store.listRevalidations();
    for (const item of items) if (item?.sourceId) pending.set(item.sourceId, item);
    return items.length;
  };

  return Object.freeze({
    async enqueue(sourceId, context = {}) {
      if (!sourceId) throw new TypeError('sourceId is required');
      if (pending.has(sourceId)) return false;
      const item = { sourceId, context, enqueuedAt: new Date(now()).toISOString(), attempts: 0 };
      pending.set(sourceId, item);
      if (store?.putRevalidation) await store.putRevalidation(item);
      return true;
    },
    async hydrate() { return hydrate(); },
    async drain(limit = Infinity) {
      let processed = 0;
      const results = [];
      while (pending.size && processed < limit) {
        const item = pending.values().next().value;
        const next = { ...item, attempts: Number(item.attempts ?? 0) + 1, lastAttemptAt: new Date(now()).toISOString() };
        pending.set(item.sourceId, next);
        if (store?.putRevalidation) await store.putRevalidation(next);
        try {
          const result = await ingest(item.sourceId, { ...item.context, revalidation: true });
          pending.delete(item.sourceId);
          if (store?.deleteRevalidation) await store.deleteRevalidation(item.sourceId);
          results.push(result);
          processed += 1;
        } catch (error) {
          const retry = { ...next, lastError: error instanceof Error ? error.message : String(error) };
          pending.set(item.sourceId, retry);
          if (store?.putRevalidation) await store.putRevalidation(retry);
          throw error;
        }
      }
      return results;
    },
    size() { return pending.size; },
  });
}
