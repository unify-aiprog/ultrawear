/** Provider-neutral durable scheduling state for continuous ingestion. */

export function createDurableScheduler({ store, now = () => Date.now() } = {}) {
  if (!store || typeof store.put !== 'function' || typeof store.list !== 'function' || typeof store.delete !== 'function') {
    throw new TypeError('store with put, list and delete is required');
  }

  const key = (sourceId) => `poll:${sourceId}`;

  return Object.freeze({
    async schedule(sourceId, context = {}, delaySeconds = 30) {
      if (!sourceId) throw new TypeError('sourceId is required');
      const item = {
        sourceId,
        context,
        scheduledAt: new Date(now() + Math.max(0, delaySeconds) * 1000).toISOString(),
        updatedAt: new Date(now()).toISOString(),
      };
      await store.put(key(sourceId), item);
      return item;
    },
    async due(at = now()) {
      const items = await store.list('poll:');
      return items.filter((item) => Date.parse(item?.scheduledAt ?? '') <= at).sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
    },
    async remove(sourceId) {
      if (!sourceId) throw new TypeError('sourceId is required');
      await store.delete(key(sourceId));
    },
    async list() { return store.list('poll:'); },
  });
}
