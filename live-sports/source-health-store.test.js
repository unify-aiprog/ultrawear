import test from 'node:test';
import assert from 'node:assert/strict';
import { createSourceHealthStore } from './source-health-store.js';

test('durable source health store persists health and revalidation records', async () => {
  const data = new Map();
  const store = createSourceHealthStore({
    put: async (key, value) => data.set(key, value),
    get: async (key) => data.get(key) ?? null,
    list: async (prefix) => [...data.entries()].filter(([key]) => key.startsWith(prefix)).map(([, value]) => value),
    remove: async (key) => data.delete(key),
  });

  const health = { sourceId: 'source-a', status: 'healthy', checkedAt: '2026-09-02T12:00:00.000Z' };
  const item = { sourceId: 'source-a', enqueuedAt: '2026-09-02T12:01:00.000Z' };

  await store.putHealth(health);
  await store.putRevalidation(item);

  assert.deepEqual(await store.getHealth('source-a'), health);
  assert.deepEqual(await store.listHealth(), [health]);
  assert.deepEqual(await store.getRevalidation('source-a'), item);
  assert.deepEqual(await store.listRevalidations(), [item]);
  await store.deleteRevalidation('source-a');
  assert.equal(await store.getRevalidation('source-a'), null);
});

test('durable store validates source identifiers', async () => {
  const store = createSourceHealthStore({ put: async () => {}, get: async () => null });
  await assert.rejects(() => store.putHealth({}), /sourceId is required/);
  await assert.rejects(() => store.putRevalidation({}), /sourceId is required/);
  assert.equal(await store.getHealth(''), null);
  await assert.rejects(() => store.deleteRevalidation('source-a'), /remove is required/);
});
