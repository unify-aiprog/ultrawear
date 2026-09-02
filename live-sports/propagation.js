/**
 * Canonical propagation boundary.
 * A reconciled event is the source of truth; downstream projections are
 * explicitly invoked so persistence, indexing and history cannot drift.
 */
export function createCanonicalPropagation({ eventStore, indexSync, teamHistory, playerHistory } = {}) {
  if (!eventStore || !indexSync || !teamHistory || !playerHistory) throw new TypeError('eventStore, indexSync, teamHistory and playerHistory are required');

  return Object.freeze({
    async publish(event, reconciliation = {}) {
      if (!event?.id) throw new TypeError('event.id is required');
      await eventStore.putEvent(event);
      const result = { event, ...reconciliation };
      await indexSync.sync(result);
      await teamHistory.put(event);
      const performances = Array.isArray(event.performances) ? event.performances : [];
      await Promise.all(performances.map((performance) => playerHistory.put(event, performance.personId, performance)));
      return result;
    },
  });
}
