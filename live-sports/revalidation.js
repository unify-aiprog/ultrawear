/** Deterministic revalidation queue with optional durable state. */
export function createRevalidationQueue({ ingest, now = () => Date.now(), store = null, retryBaseSeconds = 30, retryMaximumSeconds = 3600 } = {}) {
  if (typeof ingest !== 'function') throw new TypeError('ingest is required');
  const pending = new Map();
  const inFlight = new Set();

  const hydrate = async () => {
    if (!store?.listRevalidations) return 0;
    const items = await store.listRevalidations();
    for (const item of items) if (item?.sourceId) pending.set(item.sourceId, item);
    return items.length;
  };

  const retryDelay = (attempts) => Math.min(retryMaximumSeconds, retryBaseSeconds * (2 ** Math.max(0, attempts - 1)));

  return Object.freeze({
    async enqueue(sourceId, context = {}) {
      if (!sourceId) throw new TypeError('sourceId is required');
      if (pending.has(sourceId) || inFlight.has(sourceId)) return false;
      const item = { sourceId, context, enqueuedAt: new Date(now()).toISOString(), attempts: 0, nextAttemptAt: new Date(now()).toISOString() };
      pending.set(sourceId, item);
      if (store?.putRevalidation) await store.putRevalidation(item);
      return true;
    },
    async hydrate() { return hydrate(); },
    async drain(limit = Infinity) {
      let processed = 0;
      const results = [];
      const errors = [];
      const currentTime = now();
      for (const item of pending.values()) {
        if (processed >= limit) break;
        if (inFlight.has(item.sourceId)) continue;
        if (Date.parse(item.nextAttemptAt ?? '') > currentTime) continue;

        inFlight.add(item.sourceId);
        const next = { ...item, attempts: Number(item.attempts ?? 0) + 1, lastAttemptAt: new Date(currentTime).toISOString() };
        pending.set(item.sourceId, next);
        if (store?.putRevalidation) await store.putRevalidation(next);
        try {
          const result = await ingest(item.sourceId, { ...item.context, revalidation: true });
          pending.delete(item.sourceId);
          if (store?.deleteRevalidation) await store.deleteRevalidation(item.sourceId);
          results.push(result);
          processed += 1;
        } catch (error) {
          const retry = {
            ...next,
            lastError: error instanceof Error ? error.message : String(error),
            nextAttemptAt: new Date(currentTime + retryDelay(next.attempts) * 1000).toISOString(),
          };
          pending.set(item.sourceId, retry);
          if (store?.putRevalidation) await store.putRevalidation(retry);
          errors.push({ sourceId: item.sourceId, error: retry.lastError, nextAttemptAt: retry.nextAttemptAt });
        } finally {
          inFlight.delete(item.sourceId);
        }
      }
      return { results, errors, pending: pending.size };
    },
    size() { return pending.size; },
  });
}
