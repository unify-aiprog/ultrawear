import assert from 'node:assert/strict';
import test from 'node:test';
import { createSportEvent } from './events.js';
import { createFollow } from './follow.js';
import { createAlertCandidates, getEventTriggerReasons } from './retention.js';

const base = createSportEvent({
  id: 'event-1', sport: 'football', competition: 'league-1',
  home: { id: 'team-a', name: 'A' }, away: { id: 'team-b', name: 'B' },
  startsAt: '2026-09-02T10:00:00Z', status: 'scheduled', score: { home: 0, away: 0 },
});

test('detects start and score triggers', () => {
  const live = { ...base, status: 'live', score: { home: 1, away: 0 } };
  assert.deepEqual(getEventTriggerReasons(base, live), ['event_started', 'score_changed']);
});

test('matches event, team, competition, and sport follows', () => {
  const previous = { ...base, status: 'live' };
  const current = { ...previous, score: { home: 1, away: 0 } };
  const follows = [
    createFollow({ userId: 'u1', type: 'event', targetId: 'event-1' }),
    createFollow({ userId: 'u2', type: 'team', targetId: 'team-a' }),
    createFollow({ userId: 'u3', type: 'competition', targetId: 'league-1' }),
    createFollow({ userId: 'u4', type: 'sport', targetId: 'football' }),
  ];
  const candidates = createAlertCandidates({ previous, current, follows, createdAt: '2026-09-02T10:01:00Z' });
  assert.equal(candidates.length, 4);
  assert.ok(candidates.every((candidate) => candidate.reason === 'score_changed'));
});

test('matches athlete follows when athlete ids are present', () => {
  const previous = { ...base, status: 'live' };
  const current = { ...previous, home: { ...previous.home, athletes: [{ id: 'athlete-1' }] }, score: { home: 1, away: 0 } };
  const follow = createFollow({ userId: 'u1', type: 'athlete', targetId: 'athlete-1' });
  assert.equal(createAlertCandidates({ previous, current, follows: [follow] }).length, 1);
});

test('does not match unrelated follows and deduplicates duplicate follows', () => {
  const previous = { ...base, status: 'live' };
  const current = { ...previous, score: { home: 1, away: 0 } };
  const matching = createFollow({ userId: 'u1', type: 'event', targetId: 'event-1' });
  const unrelated = createFollow({ userId: 'u2', type: 'team', targetId: 'team-c' });
  const candidates = createAlertCandidates({ previous, current, follows: [matching, matching, unrelated] });
  assert.equal(candidates.length, 1);
});

test('emits finished and postponed reasons', () => {
  const live = { ...base, status: 'live' };
  assert.deepEqual(getEventTriggerReasons(live, { ...live, status: 'finished' }), ['event_finished']);
  assert.deepEqual(getEventTriggerReasons(live, { ...live, status: 'postponed' }), ['event_postponed']);
});
