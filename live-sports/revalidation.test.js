import test from 'node:test';
import assert from 'node:assert/strict';
import { createRevalidationQueue } from './revalidation.js';

function durableStore() {
  const values = new Map();
  return {
    values,
    async putRevalidation(item) { values.set(item.sourceId, structuredClone(item)); },
    async listRevalidations() { return [...values.values()].map((item) => structuredClone(item)); },
    async deleteRevalidation(sourceId) { values.delete(sourceId); },
  };
}

test('revalidation queue deduplicates sources and drains in order', async () => {
  const calls = [];
  const queue = createRevalidationQueue({ ingest: async (sourceId, context) => { calls.push([sourceId, context.revalidation]); return sourceId; } });
  assert.equal(await queue.enqueue('a'), true);
  assert.equal(await queue.enqueue('a'), false);
  assert.equal(await queue.enqueue('b'), true);
  assert.equal(queue.size(), 2);
  assert.deepEqual((await queue.drain(1)).results, ['a']);
  assert.equal(queue.size(), 1);
  assert.deepEqual((await queue.drain()).results, ['b']);
  assert.deepEqual(calls, [['a', true], ['b', true]]);
});

test('revalidation survives hydration and removes durable work after success', async () => {
  const store = durableStore();
  const first = createRevalidationQueue({ ingest: async () => ({ ok: true }), now: () => Date.parse('2026-09-02T12:00:00Z'), store });
  assert.equal(await first.enqueue('source-a', { reason: 'conflict' }), true);

  const second = createRevalidationQueue({ ingest: async () => ({ ok: true }), now: () => Date.parse('2026-09-02T12:00:00Z'), store });
  assert.equal(await second.hydrate(), 1);
  const drained = await second.drain();
  assert.equal(drained.results.length, 1);
  assert.equal(drained.errors.length, 0);
  assert.equal(store.values.size, 0);
});

test('failed revalidation is persisted with exponential retry metadata', async () => {
  const store = durableStore();
  const now = Date.parse('2026-09-02T12:00:00Z');
  const queue = createRevalidationQueue({ ingest: async () => { throw new Error('provider unavailable'); }, now: () => now, store, retryBaseSeconds: 30 });
  await queue.enqueue('source-b', { reason: 'conflict' });

  const drained = await queue.drain();
  assert.equal(drained.results.length, 0);
  assert.equal(drained.errors[0].error, 'provider unavailable');
  assert.equal(store.values.get('source-b').attempts, 1);
  assert.equal(store.values.get('source-b').nextAttemptAt, '2026-09-02T12:00:30.000Z');

  const retryQueue = createRevalidationQueue({ ingest: async () => ({ ok: true }), now: () => now + 29_000, store });
  await retryQueue.hydrate();
  assert.equal((await retryQueue.drain()).results.length, 0);
});

test('concurrent drains do not duplicate the same in-process revalidation', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let calls = 0;
  const queue = createRevalidationQueue({ ingest: async () => { calls += 1; await gate; return { ok: true }; }, now: () => Date.parse('2026-09-02T12:00:00Z') });
  await queue.enqueue('source-c');
  const first = queue.drain();
  const second = queue.drain();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(calls, 1);
  release();
  await Promise.all([first, second]);
  assert.equal(calls, 1);
});
