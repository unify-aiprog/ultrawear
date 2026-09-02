import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSportRadarSoccer } from './sportradar-soccer.js';

const payload = {
  sport_event: {
    id: 'sr:sport_event:123',
    start_time: '2026-09-02T18:00:00+00:00',
    sport_event_context: { competition: { id: 'sr:competition:17', name: 'Premier League' } },
    competitors: [
      { id: 'sr:competitor:1', name: 'Home FC', abbreviation: 'HOM', qualifier: 'home' },
      { id: 'sr:competitor:2', name: 'Away FC', abbreviation: 'AWA', qualifier: 'away' },
    ],
  },
  sport_event_status: {
    status: 'live',
    home_score: 1,
    away_score: 0,
    updated_at: '2026-09-02T18:42:00+00:00',
  },
  timeline: [
    { id: 'm1', description: 'goal', competitor: 'home', match_clock: '42:00', timestamp: '2026-09-02T18:42:00+00:00', player: { id: 'p1', name: 'Scorer' } },
    { id: 'm2', description: 'yellow_card', competitor: 'away', match_clock: '43:00', timestamp: '2026-09-02T18:43:00+00:00' },
  ],
};

test('normalizes a SportRadar soccer event and its timeline', () => {
  const event = normalizeSportRadarSoccer(payload, { observedAt: '2026-09-02T18:42:01+00:00' });
  assert.equal(event.id, 'sr:sport_event:123');
  assert.equal(event.sport, 'football');
  assert.deepEqual(event.competition, { id: 'sr:competition:17', name: 'Premier League' });
  assert.equal(event.status, 'live');
  assert.deepEqual(event.score, { home: 1, away: 0 });
  assert.equal(event.moments.length, 2);
  assert.equal(event.moments[0].type, 'goal');
  assert.equal(event.moments[0].actor, 'p1');
  assert.equal(event.moments[0].team, 'sr:competitor:1');
  assert.equal(event.moments[1].type, 'yellow_card');
  assert.equal(event.moments[1].team, 'sr:competitor:2');
  assert.equal(event.moment.type, 'yellow_card');
  assert.equal(event.moment.verified, false);
  assert.deepEqual(event.moment.source, { id: 'sportradar-soccer', provider: 'Sportradar' });
});

test('skips known moments that only provide a match clock', () => {
  const event = normalizeSportRadarSoccer({
    ...payload,
    timeline: [{ id: 'clock-only', description: 'goal', competitor: 'home', match_clock: '44:00' }],
  });
  assert.deepEqual(event.moments, []);
  assert.equal(event.moment, null);
});

test('skips unknown timeline records without inventing a moment', () => {
  const event = normalizeSportRadarSoccer({
    ...payload,
    timeline: [{ description: 'unknown_provider_action', match_clock: '44:00' }],
  });
  assert.deepEqual(event.moments, []);
  assert.equal(event.moment, null);
});

test('does not invent missing competitor data', () => {
  assert.throws(() => normalizeSportRadarSoccer({
    sport_event: { id: 'sr:sport_event:missing', start_time: '2026-09-02T18:00:00+00:00', competitors: [] },
    sport_event_status: { status: 'live' },
  }), /home and away competitors/);
});

test('rejects unsupported provider statuses instead of guessing', () => {
  assert.throws(() => normalizeSportRadarSoccer({
    sport_event: {
      id: 'sr:sport_event:status', start_time: '2026-09-02T18:00:00+00:00',
      competitors: [
        { id: '1', name: 'Home', qualifier: 'home' },
        { id: '2', name: 'Away', qualifier: 'away' },
      ],
    },
    sport_event_status: { status: 'mystery_status' },
  }), /Missing SportRadar field/);
});
