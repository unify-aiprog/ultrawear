import { createEventReconciler } from './event-reconciliation.js';
import { createEventStore } from './event-store.js';
import { createObservationStore } from './observation-store.js';

function memoryStore() {
  const values = new Map();
  return {
    async put(key, value) { values.set(key, value); },
    async get(key) { return values.get(key) ?? null; },
    async list(prefix) { return [...values.keys()].filter((key) => key.startsWith(prefix)); },
  };
}

const base = {
  sport: 'Football',
  competition: { id: 'pl', name: 'Premier League' },
  home: { id: 'ars', name: 'Arsenal' },
  away: { id: 'che', name: 'Chelsea' },
  startsAt: '2026-09-02T18:00:00Z',
  status: 'live',
  score: { home: 2, away: 1 },
};

test('corroborates the same event across different source IDs', async () => {
  const events = memoryStore();
  const observations = memoryStore();
  const reconciler = createEventReconciler({
    eventStore: createEventStore(events),
    observationStore: createObservationStore(observations),
  });

  const first = await reconciler.reconcile({
    sourceId: 'football-data-org',
    event: { ...base, id: 'football-data:1' },
    observedAt: '2026-09-02T18:10:00Z',
  });
  const second = await reconciler.reconcile({
    sourceId: 'thesportsdb',
    event: { ...base, id: 'thesportsdb:99' },
    observedAt: '2026-09-02T18:11:00Z',
  });

  expect(first.canonicalId).toBe(second.canonicalId);
  expect(second.matched).toBe(true);
  expect(second.reconciledFields.find((item) => item.field === 'score').verification).toBe('corroborated');
});

test('retains the winning observation and marks conflicting fields', async () => {
  const events = memoryStore();
  const observations = memoryStore();
  const reconciler = createEventReconciler({
    eventStore: createEventStore(events),
    observationStore: createObservationStore(observations),
    sourceConfidence: ({ sourceId }) => sourceId === 'trusted' ? 0.9 : 0.7,
  });

  await reconciler.reconcile({ sourceId: 'trusted', event: { ...base, id: 'trusted:1' }, observedAt: '2026-09-02T18:10:00Z' });
  const result = await reconciler.reconcile({
    sourceId: 'other',
    event: { ...base, id: 'other:1', score: { home: 1, away: 1 } },
    observedAt: '2026-09-02T18:11:00Z',
  });

  const score = result.reconciledFields.find((item) => item.field === 'score');
  expect(score.verification).toBe('conflicted');
  expect(result.event.score).toEqual({ home: 2, away: 1 });
  expect(score.sources).toEqual(['trusted', 'other']);
});
