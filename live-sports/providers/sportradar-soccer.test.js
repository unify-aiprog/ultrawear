import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSportRadarSoccer } from './sportradar-soccer.js';

const payload = {
  sport_event: {
    id: 'sr:sport_event:123',
    start_time: '2026-09-02T18:00:00+00:00',
    sport_event_context: {
      competition: { name: 'Premier League' },
    },
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
    { description: 'goal', competitor: 'home', match_clock: '42:00' },
  ],
};

test('normalizes a verified SportRadar soccer event', () => {
  const event = normalizeSportRadarSoccer(payload, { observedAt: '2026-09-02T18:42:01+00:00' });
  assert.equal(event.id, 'sr:sport_event:123');
  assert.equal(event.status, 'live');
  assert.deepEqual(event.score, { home: 1, away: 0 });
  assert.equal(event.moment.type, 'goal');
  assert.equal(event.moment.verified, true);
  assert.equal(event.source.provider, 'Sportradar');
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
