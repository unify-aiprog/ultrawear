import { createLiveSourceRegistry } from './live-source-registry.js';

const source = (overrides = {}) => ({
  id: 'test-source',
  name: 'Test Source',
  sport: 'football',
  fetch: async () => [{ id: 'raw-1' }],
  normalize: (payload) => ({ id: payload.id, sport: 'football' }),
  ...overrides,
});

test('registers and retrieves live sources', () => {
  const registry = createLiveSourceRegistry({ sources: [source()] });
  expect(registry.get('test-source').name).toBe('Test Source');
  expect(registry.list()).toHaveLength(1);
});

test('rejects duplicate source ids', () => {
  const registry = createLiveSourceRegistry({ sources: [source()] });
  expect(() => registry.register(source())).toThrow('Live source already registered');
});

test('fetches and normalizes every registered source', async () => {
  const registry = createLiveSourceRegistry({ sources: [
    source(),
    source({ id: 'test-basketball', sport: 'basketball', fetch: async () => [{ id: 'raw-2' }], normalize: (payload) => ({ id: payload.id, sport: 'basketball' }) }),
  ] });
  const feeds = await registry.fetchAll({ observedAt: '2026-09-02T00:00:00.000Z' });
  expect(feeds).toHaveLength(2);
  expect(feeds[0].events[0]).toEqual({ id: 'raw-1', sport: 'football' });
  expect(feeds[1].events[0]).toEqual({ id: 'raw-2', sport: 'basketball' });
});

test('does not silently convert a failed source fetch into an empty feed', async () => {
  const registry = createLiveSourceRegistry({ sources: [source({ fetch: async () => { throw new Error('upstream unavailable'); } })] });
  await expect(registry.fetchAll()).rejects.toThrow('upstream unavailable');
});
