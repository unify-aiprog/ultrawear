import test from 'node:test';
import assert from 'node:assert/strict';
import { createKvDurableScheduler } from './kv-durable-scheduler.js';

function kv() {
  const data = new Map();
  return {
    async put(key, value) { data.set(key, value); },
    async get(key, type) {
      const value = data.get(key);
      if (value == null) return null;
      return type === 'json' ? JSON.parse(value) : value;
    },
    async list({ prefix }) {
      return { keys: [...data.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
    async delete(key) { data.delete(key); },
  };
}

test('KV scheduler persists and retrieves due state', async () => {
  const now = Date.parse('2026-09-02T12:00:00.000Z');
  const scheduler = createKvDurableScheduler(kv(), { now: () => now });
  const item = await scheduler.schedule('source-a', { eventStatus: 'live' }, 30);
  assert.deepEqual(await scheduler.due(now + 29_000), []);
  assert.deepEqual(await scheduler.due(now + 30_000), [item]);
  await scheduler.remove('source-a');
  assert.deepEqual(await scheduler.list(), []);
});
