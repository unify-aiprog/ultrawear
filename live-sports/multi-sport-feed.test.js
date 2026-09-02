import test from 'node:test';
import assert from 'node:assert/strict';
import { combineSportFeeds, groupSportFeeds, selectLiveSportEvents } from './multi-sport-feed.js';

test('combineSportFeeds keeps distinct sports and prioritizes live events', () => {
  const events = combineSportFeeds([
    { sport: 'Football', events: [{ id: 'f1', sport: 'Football', status: 'scheduled', startsAt: '2026-09-02T18:00:00Z' }] },
    { sport: 'Basketball', events: [{ id: 'b1', sport: 'Basketball', status: 'live', startsAt: '2026-09-02T20:00:00Z' }] },
  ]);
  assert.deepEqual(events.map((event) => event.id), ['b1', 'f1']);
});

test('combineSportFeeds deduplicates by canonical identity and keeps the live observation', () => {
  const events = combineSportFeeds([
    { events: [{ id: 'e1', canonicalId: 'canonical:e1', status: 'scheduled', startsAt: '2026-09-02T18:00:00Z' }] },
    { events: [{ id: 'e2', canonicalId: 'canonical:e1', status: 'live', startsAt: '2026-09-02T18:00:00Z' }] },
  ]);
  assert.equal(events.length, 1);
  assert.equal(events[0].id, 'e2');
});

test('groupSportFeeds creates deterministic sport buckets', () => {
  const grouped = groupSportFeeds([
    { id: '1', sport: 'Football' },
    { id: '2', sport: 'Basketball' },
    { id: '3', sport: 'Football' },
  ]);
  assert.deepEqual(grouped, {
    football: [{ id: '1', sport: 'Football' }, { id: '3', sport: 'Football' }],
    basketball: [{ id: '2', sport: 'Basketball' }],
  });
});

test('selectLiveSportEvents can restrict the live surface to selected sports', () => {
  const events = selectLiveSportEvents([
    { id: 'f1', sport: 'Football', status: 'live' },
    { id: 'b1', sport: 'Basketball', status: 'live' },
    { id: 't1', sport: 'Tennis', status: 'finished' },
  ], { sports: ['basketball'] });
  assert.deepEqual(events.map((event) => event.id), ['b1']);
});
