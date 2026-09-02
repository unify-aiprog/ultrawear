import assert from 'node:assert/strict';
import test from 'node:test';
import { createSportEvent } from './events.js';
import { createSourceAdapter } from './adapter.js';
import { createSourceRegistry } from './registry.js';

test('registry rejects duplicate source ids', () => {
  const registry = createSourceRegistry();
  const adapter = createSourceAdapter({ id: 'source', name: 'Source', normalize: () => null });
  registry.register(adapter);
  assert.throws(() => registry.register(adapter), /Source already registered/);
});

test('registry ingests and updates the same event idempotently', () => {
  const registry = createSourceRegistry();
  registry.register(createSourceAdapter({
    id: 'source',
    name: 'Source',
    normalize: (payload) => createSportEvent({ ...payload, source: { id: 'source' } }),
  }));

  const payload = {
    id: 'event-1', sport: 'football', competition: 'League',
    home: { id: 'home', name: 'Home' }, away: { id: 'away', name: 'Away' },
    startsAt: '2026-09-01T18:00:00Z', status: 'live',
    score: { home: 0, away: 0 }, updatedAt: '2026-09-01T18:00:00Z',
  };

  const first = registry.ingest('source', payload);
  const second = registry.ingest('source', payload);
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.changed, false);
  assert.equal(registry.listEvents().length, 1);

  const updated = registry.ingest('source', { ...payload, score: { home: 1, away: 0 }, updatedAt: '2026-09-01T18:02:00Z' });
  assert.equal(updated.changed, true);
  assert.deepEqual(registry.getEvent('event-1').score, { home: 1, away: 0 });
});
