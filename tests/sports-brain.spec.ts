import { test, expect } from '@playwright/test';
import { buildSportsProgramme, programmePriority, scoreEvent } from '@/lib/sports/programme';
import type { NormalizedSportsEvent } from '@/lib/sports/types';

const event = (overrides: Partial<NormalizedSportsEvent> = {}): NormalizedSportsEvent => ({
  id: 'test-1', sport: 'football', startsAt: '2026-09-05T20:00:00.000Z', status: 'SCHEDULED', competition: 'Premier League',
  home: { id: 'a', name: 'Arsenal' }, away: { id: 'b', name: 'Chelsea' }, homeScore: null, awayScore: null,
  provider: 'test', providerId: '1', ...overrides,
});

test.describe('Sports Brain', () => {
  const now = Date.parse('2026-09-05T12:00:00.000Z');

  test('live events outrank upcoming events', () => {
    const live = event({ id: 'live', status: 'IN_PLAY' });
    const upcoming = event({ id: 'upcoming', startsAt: '2026-09-05T21:00:00.000Z' });
    const programme = buildSportsProgramme([upcoming, live], 'all', now);
    expect(programme.lead?.id).toBe('live');
    expect(programme.lead?.priority).toBe('LIVE');
  });

  test('finals and major competitions receive featured priority', () => {
    const final = event({ id: 'final', competition: 'Champions League Final', stage: 'FINAL' });
    expect(scoreEvent(final, now)).toBeGreaterThanOrEqual(55);
    expect(['BLOCKBUSTER', 'FEATURED']).toContain(programmePriority(final, now));
  });

  test('programme never treats cancelled or postponed events as upcoming', () => {
    const cancelled = event({ id: 'cancelled', status: 'CANCELLED' });
    const postponed = event({ id: 'postponed', status: 'POSTPONED' });
    const programme = buildSportsProgramme([cancelled, postponed], 'all', now);
    expect(programme.lead).toBeNull();
    expect(programme.next).toHaveLength(0);
  });

  test('programme is deterministic for the same input clock', () => {
    const events = [event({ id: 'a' }), event({ id: 'b', startsAt: '2026-09-06T15:00:00.000Z' })];
    expect(buildSportsProgramme(events, 'all', now)).toEqual(buildSportsProgramme(events, 'all', now));
  });
});
