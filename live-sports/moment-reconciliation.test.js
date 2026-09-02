import test from 'node:test';
import assert from 'node:assert/strict';
import { createMomentReconciler, canonicalMomentIdentity } from './moment-reconciliation.js';

function createMemoryObservationStore() {
  const values = new Map();
  return {
    async putObservation(observation) {
      const key = [observation.entityType, observation.entityId, observation.field, observation.observedAt, observation.sourceId].join('|');
      values.set(key, observation);
    },
    async listObservations(entityId, field = null, entityType = 'event') {
      return [...values.values()]
        .filter((item) => item.entityType === entityType && item.entityId === entityId && (!field || item.field === field))
        .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    },
  };
}

const baseMoment = {
  type: 'goal',
  occurredAt: '2026-09-02T12:34:56Z',
  minute: 73,
  title: 'Goal',
  description: 'Goal scored',
  actor: { id: 'player-1', name: 'Player One' },
  team: { id: 'team-home', name: 'Home FC' },
  related: [],
  animation: { type: 'impact' },
};

function createReconciler() {
  return createMomentReconciler({
    observationStore: createMemoryObservationStore(),
    sourceConfidence: () => 0.9,
  });
}

test('same moment from two sources becomes one corroborated canonical moment', async () => {
  const observationStore = createMemoryObservationStore();
  const reconciler = createMomentReconciler({ observationStore, sourceConfidence: () => 0.9 });
  const first = await reconciler.reconcile({
    eventId: 'event:1',
    incomingMoments: [baseMoment],
    sourceId: 'source-a',
    observedAt: '2026-09-02T12:35:00Z',
  });
  const second = await reconciler.reconcile({
    eventId: 'event:1',
    incomingMoments: [baseMoment],
    existingMoments: first.moments,
    sourceId: 'source-b',
    observedAt: '2026-09-02T12:35:10Z',
  });

  assert.equal(second.moments.length, 1);
  assert.equal(second.moments[0].id, canonicalMomentIdentity('event:1', baseMoment));
  assert.equal(second.moments[0].verified, true);
  assert.deepEqual(second.moments[0].source.sources.sort(), ['source-a', 'source-b']);
});

test('conflicting field values remain visible as conflict without duplicating the moment', async () => {
  const observationStore = createMemoryObservationStore();
  const reconciler = createMomentReconciler({ observationStore, sourceConfidence: () => 0.9 });
  const first = await reconciler.reconcile({
    eventId: 'event:2',
    incomingMoments: [baseMoment],
    sourceId: 'source-a',
    observedAt: '2026-09-02T12:35:00Z',
  });
  const conflicting = { ...baseMoment, description: 'Different provider description' };
  const second = await reconciler.reconcile({
    eventId: 'event:2',
    incomingMoments: [conflicting],
    existingMoments: first.moments,
    sourceId: 'source-b',
    observedAt: '2026-09-02T12:35:10Z',
  });

  assert.equal(second.moments.length, 1);
  assert.equal(second.conflicted, true);
  assert.equal(second.results[0].reconciled.find((item) => item.field === 'description').verification, 'conflicted');
  assert.equal(second.moments[0].verified, true);
});

test('one source stays unverified', async () => {
  const reconciler = createReconciler();
  const result = await reconciler.reconcile({
    eventId: 'event:3',
    incomingMoments: [baseMoment],
    sourceId: 'source-a',
    observedAt: '2026-09-02T12:35:00Z',
  });

  assert.equal(result.moments.length, 1);
  assert.equal(result.moments[0].verified, false);
  assert.equal(result.verified, false);
});
