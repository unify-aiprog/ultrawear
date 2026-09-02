/**
 * Deterministic revalidation queue. It schedules sources whose canonical
 * observations are stale and prevents duplicate work for the same source.
 */
export function createRevalidationQueue({ ingest, now = () => Date.now() } = {}) {
  if (typeof ingest !== 'function') throw new TypeError('ingest is required');
  const pending = new Map();

  return Object.freeze({
    enqueue(sourceId, context = {}) {
      if (!sourceId) throw new TypeError('sourceId is required');
      if (pending.has(sourceId)) return false;
      pending.set(sourceId, { sourceId, context, enqueuedAt: new Date(now()).toISOString() });
      return true;
    },
    async drain(limit = Infinity) {
      let processed = 0;
      const results = [];
      while (pending.size && processed < limit) {
        const item = pending.values().next().value;
        pending.delete(item.sourceId);
        results.push(await ingest(item.sourceId, { ...item.context, revalidation: true }));
        processed += 1;
      }
      return results;
    },
    size() { return pending.size; },
  });
}
