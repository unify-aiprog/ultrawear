/** Sync changed canonical events into the homepage/event discovery index. */

export function createEventIndexSync(eventIndex) {
  if (!eventIndex || typeof eventIndex.put !== 'function') {
    throw new TypeError('Event index is required');
  }

  return Object.freeze({
    async sync(result) {
      if (!result?.event || !result.changed) return result;
      await eventIndex.put(result.event);
      return result;
    },
  });
}
