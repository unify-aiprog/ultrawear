import test from 'node:test';
import assert from 'node:assert/strict';
import { createRevalidationQueue } from './revalidation.js';

test('revalidation queue deduplicates sources and drains in order', async () => {
  const calls = [];
  const queue = createRevalidationQueue({ ingest: async (sourceId, context) => { calls.push([sourceId, context.revalidation]); return sourceId; } });
  assert.equal(queue.enqueue('a'), true);
  assert.equal(queue.enqueue('a'), false);
  assert.equal(queue.enqueue('b'), true);
  assert.equal(queue.size(), 2);
  assert.deepEqual(await queue.drain(1), ['a']);
  assert.equal(queue.size(), 1);
  assert.deepEqual(await queue.drain(), ['b']);
  assert.deepEqual(calls, [['a', true], ['b', true]]);
});
