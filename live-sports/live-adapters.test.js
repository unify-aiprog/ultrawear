import assert from 'node:assert/strict';
import test from 'node:test';
import { createSportEvent } from './events.js';
import { createSourceAdapter, normalizeSourceEvent, createSourceHealth } from './adapter.js';
import { getFreshness, isEventFresh } from './freshness.js';
import { createEventPageModel } from './event-page.js';

test('normalizes provider payloads through an adapter', () => {
  const adapter = createSourceAdapter({
    id: 'test-source',
    name: 'Test Source',
    normalize: (payload) => createSportEvent({
      id: payload.id,
      sport: payload.sport,
      competition: payload.competition,
      home: payload.home,
      away: payload.away,
      startsAt: payload.startsAt,
      status: payload.status,
      score: payload.score,
      updatedAt: payload.updatedAt,
      source: { id: 'test-source' },
    }),
  });
  const event = normalizeSourceEvent(adapter, {
    id: 'evt-1', sport: 'football', competition: 'League',
    home: { id: 'h', name: 'Home' }, away: { id: 'a', name: 'Away' },
    startsAt: '2026-09-01T18:00:00Z', status: 'live',
    score: { home: 1, away: 0 }, updatedAt: '2026-09-01T18:01:00Z',
  });
  assert.equal(event.id, 'evt-1');
  assert.deepEqual(event.score, { home: 1, away: 0 });
});

test('marks live data stale after its freshness window', () => {
  const event = createSportEvent({
    id: 'evt-2', sport: 'basketball', competition: 'League',
    home: { id: 'h', name: 'Home' }, away: { id: 'a', name: 'Away' },
    startsAt: '2026-09-01T18:00:00Z', status: 'live',
    updatedAt: '2026-09-01T18:00:00Z',
  });
  assert.equal(isEventFresh(event, new Date('2026-09-01T18:01:00Z')), true);
  assert.equal(isEventFresh(event, new Date('2026-09-01T18:03:00Z')), false);
  assert.equal(getFreshness(event, new Date('2026-09-01T18:03:00Z')).fresh, false);
});

test('builds a stable event page model with community counters', () => {
  const event = createSportEvent({
    id: 'evt-3', sport: 'tennis', competition: 'Open',
    home: { id: 'p1', name: 'Player 1' }, away: { id: 'p2', name: 'Player 2' },
    startsAt: '2026-09-01T18:00:00Z', status: 'scheduled',
    updatedAt: '2026-09-01T17:00:00Z',
  });
  const page = createEventPageModel(event, { community: { reactions: 7, questions: 2 } });
  assert.equal(page.type, 'sport_event');
  assert.equal(page.community.reactions, 7);
  assert.equal(page.community.questions, 2);
  assert.equal(page.community.polls, 0);
});

test('validates source health contracts', () => {
  assert.deepEqual(createSourceHealth({ sourceId: 'x', status: 'healthy', checkedAt: '2026-09-01T18:00:00Z' }), {
    sourceId: 'x', status: 'healthy', checkedAt: '2026-09-01T18:00:00Z', observedAt: null, latencyMs: null, message: null,
  });
});
