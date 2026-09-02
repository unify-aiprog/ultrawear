import assert from 'node:assert/strict';
import test from 'node:test';
import { createEventStore } from './store.js';

function event(overrides = {}) {
  return {
    id: 'sr:event:1',
    sport: 'Football',
    startsAt: '2026-09-02T10:00:00.000Z',
    status: 'live',
    updatedAt: '2026-09-02T10:00:00.000Z',
    source: { id: 'test', provider: 'Test', observedAt: '2026-09-02T10:00:00.000Z' },
    ...overrides,
  };
}

test('upsert stores latest event and preserves bounded history', () => {
  const store = createEventStore({ now: () => '2026-09-02T10:00:00.000Z', maxHistory: 2 });
  store.upsert(event(), '2026-09-02T10:00:00.000Z');
  store.upsert(event({ score: { home: 1, away: 0 } }), '2026-09-02T10:01:00.000Z');
  store.upsert(event({ score: { home: 2, away: 0 } }), '2026-09-02T10:02:00.000Z');

  assert.deepEqual(store.get('sr:event:1').score, { home: 2, away: 0 });
  assert.equal(store.getHistory('sr:event:1').length, 2);
  assert.equal(store.getHistory('sr:event:1')[0].version, 2);
  assert.equal(store.getHistory('sr:event:1')[1].version, 3);
});

test('list can expose only fresh events and exclude terminal events', () => {
  const store = createEventStore();
  store.upsert(event({ id: 'live', updatedAt: '2026-09-02T10:00:00.000Z' }));
  store.upsert(event({ id: 'finished', status: 'finished', updatedAt: '2026-09-01T00:00:00.000Z' }));

  assert.deepEqual(store.list({ now: '2026-09-02T10:01:00.000Z', freshOnly: true }).map((item) => item.id), ['live']);
  assert.deepEqual(store.list({ includeTerminal: false }).map((item) => item.id), ['live']);
});

test('stored events are cloned so callers cannot mutate canonical state', () => {
  const store = createEventStore();
  const original = event({ score: { home: 0, away: 0 } });
  store.upsert(original);
  const copy = store.get(original.id);
  copy.score.home = 99;
  assert.equal(store.get(original.id).score.home, 0);
});

test('prune removes stale events', () => {
  const store = createEventStore();
  store.upsert(event({ updatedAt: '2026-09-01T00:00:00.000Z' }));
  assert.equal(store.prune({ now: '2026-09-02T00:00:00.000Z', maxAgeMs: 3600000 }), 1);
  assert.equal(store.get('sr:event:1'), null);
});
