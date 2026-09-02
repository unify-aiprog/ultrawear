import assert from 'node:assert/strict';
import test from 'node:test';
import { createIngestionRunner } from './ingestion.js';
import { createSourceRegistry } from './registry.js';
import { createSourceAdapter } from './adapter.js';

test('ingestion runner normalizes a fetched payload and reports healthy source', async () => {
  const adapter = createSourceAdapter({
    id: 'fixture', name: 'Fixture', normalize: () => ({ id: 'event-1', startsAt: '2026-09-02T10:00:00Z' }),
  });
  const registry = createSourceRegistry();
  registry.register(adapter);
  const runner = createIngestionRunner({
    registry,
    fetchSource: async () => ({ fixture: true }),
    now: () => '2026-09-02T10:01:00Z',
  });
  const result = await runner('fixture');
  assert.equal(result.ok, true);
  assert.equal(result.health.status, 'healthy');
  assert.equal(result.event.id, 'event-1');
});

test('ingestion runner persists changed canonical events', async () => {
  const registry = createSourceRegistry();
  registry.register(createSourceAdapter({
    id: 'fixture',
    name: 'Fixture',
    normalize: () => ({ id: 'event-1', startsAt: '2026-09-02T10:00:00Z' }),
  }));
  const stored = [];
  const runner = createIngestionRunner({
    registry,
    fetchSource: async () => ({ fixture: true }),
    eventStore: { putEvent: async (event) => stored.push(event) },
    now: () => '2026-09-02T10:01:00Z',
  });
  const result = await runner('fixture');
  assert.equal(result.ok, true);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].id, 'event-1');
});

test('ingestion runner isolates provider failures as offline health', async () => {
  const registry = createSourceRegistry();
  registry.register(createSourceAdapter({ id: 'fixture', name: 'Fixture', normalize: () => ({ id: 'event-1', startsAt: '2026-09-02T10:00:00Z' }) }));
  const runner = createIngestionRunner({
    registry,
    fetchSource: async () => { throw new Error('provider timeout'); },
    now: () => '2026-09-02T10:01:00Z',
  });
  const result = await runner('fixture');
  assert.equal(result.ok, false);
  assert.equal(result.health.status, 'offline');
  assert.equal(result.error, 'provider timeout');
});
