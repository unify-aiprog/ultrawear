import { createFootballDataAdapter } from './football-data.js';

test('normalizes football-data v4 match payloads', () => {
  const adapter = createFootballDataAdapter();
  const event = adapter.normalize({
    id: 123,
    utcDate: '2026-09-02T18:00:00Z',
    status: 'IN_PLAY',
    competition: { id: 2021, name: 'Premier League', code: 'PL' },
    homeTeam: { id: 57, name: 'Arsenal FC' },
    awayTeam: { id: 61, name: 'Chelsea FC' },
    score: { fullTime: { home: 2, away: 1 } },
    venue: 'Emirates Stadium',
  }, { observedAt: '2026-09-02T19:15:00Z' });

  expect(event).toMatchObject({
    id: 'football-data:123',
    sport: 'football',
    status: 'live',
    score: { home: 2, away: 1 },
    home: { id: '57', name: 'Arsenal FC' },
    away: { id: '61', name: 'Chelsea FC' },
  });
});

test('rejects unsupported statuses', () => {
  expect(() => createFootballDataAdapter().normalize({
    id: 1,
    utcDate: '2026-09-02T18:00:00Z',
    status: 'UNKNOWN',
    competition: { id: 1, name: 'Test' },
    homeTeam: { id: 1, name: 'Home' },
    awayTeam: { id: 2, name: 'Away' },
  })).toThrow('Unsupported football-data status');
});
