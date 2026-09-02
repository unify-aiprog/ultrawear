import test from 'node:test';
import assert from 'node:assert/strict';
import { createRevalidationQueue } from './revalidation.js';

test('revalidation queue deduplicates sources and drains in order', async () => {
  const calls = [];
  const queue = createRevalidationQueue({ ingest: async (sourceId, context) => { calls.push([sourceId, context.revalidation]); return sourceId; } });
  assert.equal(await queue.enqueue('a'), true);
  assert.equal(await queue.enqueue('a'), false);
  assert.equal(await queue.enqueue('b'), true);
  assert.equal(queue.size(), 2);
  assert.deepEqual(await queue.drain(1), ['a']);
  assert.equal(queue.size(), 1);
  assert.deepEqual(await queue.drain(), ['b']);
  assert.deepEqual(calls, [['a', true], ['b', true]]);
});

test('durable queue hydrates, deletes successful work, and preserves failed work', async () => {
  const data = new Map();
  const store = {
    putRevalidation: async (item) => data.set(item.sourceId, item),
    listRevalidations: async () => [...data.values()],
    deleteRevalidation: async (sourceId) => data.delete(sourceId),
  };
  await store.putRevalidation({ sourceId: 'a', context: { reason: 'stale' }, enqueuedAt: '2026-09-02T12:00:00.000Z', attempts: 2 });
  let fail = true;
  const queue = createRevalidationQueue({
    store,
    ingest: async (sourceId) => {
      if (fail) { fail = false; throw new Error('temporary outage'); }
      return sourceId;
    },
    now: () => Date.parse('2026-09-02T12:01:00.000Z'),
  });
  assert.equal(await queue.hydrate(), 1);
  await assert.rejects(() => queue.drain(), /temporary outage/);
  assert.equal(queue.size(), 1);
  assert.equal((await store.listRevalidations())[0].attempts, 3);
  assert.equal((await store.listRevalidations())[0].lastError, 'temporary outage');
  assert.deepEqual(await queue.drain(), ['a']);
  assert.equal(queue.size(), 0);
  assert.deepEqual(await store.listRevalidations(), []);
});
