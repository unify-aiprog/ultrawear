import { createSportradarSoccerLiveSource } from './sportradar-live-source.js';

test('creates a registry-compatible Sportradar soccer live source', () => {
  const source = createSportradarSoccerLiveSource({ SPORTRADAR_API_KEY: 'test-key' });
  expect(source).toMatchObject({
    id: 'sportradar-soccer',
    sport: 'football',
  });
  expect(typeof source.fetch).toBe('function');
  expect(typeof source.normalize).toBe('function');
});

test('normalizes through the existing canonical SportRadar adapter', () => {
  const source = createSportradarSoccerLiveSource({ SPORTRADAR_API_KEY: 'test-key' });
  const normalize = jest.spyOn(source, 'normalize');
  expect(() => source.normalize(null, { observedAt: '2026-09-02T00:00:00.000Z' })).toThrow();
  expect(normalize).toHaveBeenCalledWith(null, { observedAt: '2026-09-02T00:00:00.000Z' });
});
