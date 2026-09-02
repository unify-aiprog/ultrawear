import test from 'node:test';
import assert from 'node:assert/strict';
import { createAtomicClaimScheduler } from './atomic-claim-scheduler.js';

function scheduler() {
  return {
    async due() { return []; },
    async schedule(sourceId, context, delaySeconds) { return { sourceId, context, delaySeconds }; },
    async remove(sourceId) { return sourceId; },
    async list() { return []; },
  };
}

test('atomic claim scheduler exposes a bounded lease contract', async () => {
  const calls = [];
  const wrapped = createAtomicClaimScheduler({
    scheduler: scheduler(),
    leaseSeconds: 45,
    now: () => 1234,
    claim: async (sourceId, options) => {
      calls.push([sourceId, options]);
      return true;
    },
  });

  assert.equal(await wrapped.claim('source-a', 5678), true);
  assert.deepEqual(calls, [['source-a', { leaseSeconds: 45, now: 5678 }]]);
  assert.deepEqual(await wrapped.schedule('source-a', { eventStatus: 'live' }, 8), {
    sourceId: 'source-a', context: { eventStatus: 'live' }, delaySeconds: 8,
  });
});

test('atomic claim scheduler does not claim when the backend rejects the lease', async () => {
  const wrapped = createAtomicClaimScheduler({
    scheduler: scheduler(),
    claim: async () => false,
  });
  assert.equal(await wrapped.claim('source-b'), false);
});
