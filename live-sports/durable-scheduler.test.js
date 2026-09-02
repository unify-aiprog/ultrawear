import test from 'node:test';
import assert from 'node:assert/strict';
import { createDurableScheduler } from './durable-scheduler.js';

test('durable scheduler stores, lists and removes polling state', async () => {
  const data = new Map();
  const store = {
    put: async (key, value) => data.set(key, value),
    list: async (prefix) => [...data.entries()].filter(([key]) => key.startsWith(prefix)).map(([, value]) => value),
    delete: async (key) => data.delete(key),
  };
  const now = Date.parse('2026-09-02T12:00:00.000Z');
  const scheduler = createDurableScheduler({ store, now: () => now });

  const item = await scheduler.schedule('source-a', { eventStatus: 'live' }, 30);
  assert.equal(item.scheduledAt, '2026-09-02T12:00:30.000Z');
  assert.deepEqual(await scheduler.due(now + 29_000), []);
  assert.deepEqual(await scheduler.due(now + 30_000), [item]);
  assert.deepEqual(await scheduler.list(), [item]);
  await scheduler.remove('source-a');
  assert.deepEqual(await scheduler.list(), []);
});
