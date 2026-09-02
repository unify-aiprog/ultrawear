import { eventMatchScore, findBestEventMatch } from './event-matching.js';

const base = {
  startsAt: '2026-09-02T18:00:00Z',
  home: { name: 'Arsenal FC' },
  away: { name: 'Chelsea' },
};

test('matches equivalent team names across providers', () => {
  expect(eventMatchScore(base, {
    ...base,
    home: { name: 'Arsenal' },
  })).toBe(0.98);
});

test('rejects distant or unrelated events', () => {
  expect(eventMatchScore(base, {
    ...base,
    startsAt: '2026-09-03T18:00:00Z',
  })).toBe(0);
  expect(eventMatchScore(base, {
    ...base,
    away: { name: 'Liverpool' },
  })).toBe(0.55);
});

test('returns highest-confidence candidate', () => {
  const result = findBestEventMatch(base, [
    { ...base, home: { name: 'Liverpool' } },
    { ...base, home: { name: 'Arsenal' } },
  ]);
  expect(result.score).toBe(0.98);
});
