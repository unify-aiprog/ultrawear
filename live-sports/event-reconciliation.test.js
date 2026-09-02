import test from 'node:test';
import assert from 'node:assert/strict';
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
  const reconciler = createEventReconciler({ eventStore: createEventStore(events), observationStore: createObservationStore(observations) });

  const first = await reconciler.reconcile({ sourceId: 'football-data-org', event: { ...base, id: 'football-data:1' }, observedAt: '2026-09-02T18:10:00Z' });
  const second = await reconciler.reconcile({ sourceId: 'thesportsdb', event: { ...base, id: 'thesportsdb:99' }, observedAt: '2026-09-02T18:11:00Z' });

  assert.equal(first.canonicalId, second.canonicalId);
  assert.equal(second.matched, true);
  assert.equal(second.reconciledFields.find((item) => item.field === 'score').verification, 'corroborated');
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
  const result = await reconciler.reconcile({ sourceId: 'other', event: { ...base, id: 'other:1', score: { home: 1, away: 1 } }, observedAt: '2026-09-02T18:11:00Z' });

  const score = result.reconciledFields.find((item) => item.field === 'score');
  assert.equal(score.verification, 'conflicted');
  assert.deepEqual(result.event.score, { home: 2, away: 1 });
  assert.deepEqual(score.sources, ['trusted', 'other']);
});

test('audit records use the actual pre-ingestion verification state', async () => {
  const events = memoryStore();
  const observations = memoryStore();
  const audits = memoryStore();
  const reconciler = createEventReconciler({
    eventStore: createEventStore(events),
    observationStore: createObservationStore(observations),
    auditStore: { async putAudit(record) { await audits.put(record.id, record); } },
  });

  const first = await reconciler.reconcile({ sourceId: 'source-a', event: { ...base, id: 'source-a:1' }, observedAt: '2026-09-02T18:10:00Z' });
  const second = await reconciler.reconcile({ sourceId: 'source-b', event: { ...base, id: 'source-b:1' }, observedAt: '2026-09-02T18:11:00Z' });

  const firstAudit = first.audits.find((item) => item.field === 'score');
  const secondAudit = second.audits.find((item) => item.field === 'score');
  assert.equal(firstAudit.action, 'accepted');
  assert.equal(firstAudit.previousVerification, null);
  assert.equal(secondAudit.action, 'reverified');
  assert.equal(secondAudit.previousVerification, 'unverified');
  assert.deepEqual(secondAudit.previousValue, { home: 2, away: 1 });
});

test('audit records classify a value change from the persisted prior observation', async () => {
  const events = memoryStore();
  const observations = memoryStore();
  const audits = [];
  const reconciler = createEventReconciler({
    eventStore: createEventStore(events),
    observationStore: createObservationStore(observations),
    auditStore: { async putAudit(record) { audits.push(record); } },
  });

  await reconciler.reconcile({ sourceId: 'source-a', event: { ...base, id: 'source-a:1' }, observedAt: '2026-09-02T18:10:00Z' });
  const result = await reconciler.reconcile({ sourceId: 'source-a', event: { ...base, id: 'source-a:1', score: { home: 3, away: 1 } }, observedAt: '2026-09-02T18:11:00Z' });

  const score = result.audits.find((item) => item.field === 'score');
  assert.equal(score.action, 'changed');
  assert.deepEqual(score.previousValue, { home: 2, away: 1 });
  assert.deepEqual(score.value, { home: 3, away: 1 });
});
