import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanonicalPropagation } from './propagation.js';

test('canonical propagation persists and projects one reconciled event', async () => {
  const calls = [];
  const event = { id: 'event:1', performances: [{ personId: 'player:1' }] };
  const propagation = createCanonicalPropagation({
    eventStore: { putEvent: async (value) => calls.push(['store', value.id]) },
    indexSync: { sync: async (value) => calls.push(['index', value.event.id]) },
    teamHistory: { put: async (value) => calls.push(['team', value.id]) },
    playerHistory: { put: async (value, personId) => calls.push(['player', value.id, personId]) },
  });
  await propagation.publish(event);
  assert.deepEqual(calls, [['store', 'event:1'], ['index', 'event:1'], ['team', 'event:1'], ['player', 'event:1', 'player:1']]);
});
