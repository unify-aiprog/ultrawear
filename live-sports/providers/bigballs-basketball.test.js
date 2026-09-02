import { normalizeBigBallsBasketball, createBigBallsBasketballAdapter } from './bigballs-basketball.js';

test('normalizes a live basketball match into the canonical event contract', () => {
  const event = normalizeBigBallsBasketball({
    id: 'game-123',
    status: 'live',
    starts_at: '2026-09-02T00:00:00.000Z',
    home_team: { id: 'h1', name: 'Home Hoops' },
    away_team: { id: 'a1', name: 'Away Hoops' },
    scores: { value: { home: 82, away: 79 } },
    league: { id: 'nba', name: 'NBA' },
  }, { observedAt: '2026-09-02T10:00:00.000Z' });

  expect(event).toMatchObject({
    id: 'bigballs-basketball:game-123',
    sport: 'basketball',
    status: 'live',
    score: { home: 82, away: 79 },
    home: { id: 'h1', name: 'Home Hoops' },
    away: { id: 'a1', name: 'Away Hoops' },
    source: 'bigballs-basketball',
  });
});

test('creates a server-side basketball source with no browser credential surface', () => {
  const source = createBigBallsBasketballAdapter({ apiKey: 'test-key' });
  expect(source).toMatchObject({ id: 'bigballs-basketball', sport: 'basketball' });
  expect(typeof source.fetch).toBe('function');
  expect(typeof source.normalize).toBe('function');
});

test('requires the basketball API key only when fetching', async () => {
  const source = createBigBallsBasketballAdapter();
  await expect(source.fetch()).rejects.toThrow('BBS_API_KEY is not configured');
});
