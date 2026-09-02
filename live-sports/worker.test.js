import { createLiveSportsWorker } from './worker.js';

const adapter = {
  id: 'test-source',
  name: 'Test source',
  sport: 'Football',
  normalize(payload, context) {
    return {
      id: payload.id,
      sport: 'Football',
      competition: 'Test',
      home: { id: 'home', name: 'Home' },
      away: { id: 'away', name: 'Away' },
      startsAt: '2026-09-02T19:00:00Z',
      status: 'live',
      score: { home: payload.home, away: payload.away },
      venue: null,
      source: { id: 'test-source', provider: 'Test', observedAt: context.observedAt },
      moment: null,
      updatedAt: context.observedAt,
    };
  },
};

function memoryKv() {
  const values = new Map();
  return {
    async get(key) { return values.get(key) ?? null; },
    async put(key, value) { values.set(key, value); },
  };
}

test('worker persists changed events and updates discovery index', async () => {
  const store = memoryKv();
  const index = memoryKv();
  const worker = createLiveSportsWorker({
    env: { EVENT_STORE: store, EVENT_INDEX: index },
    adapter,
    fetchSource: async () => ({ id: 'event-1', home: 2, away: 1 }),
  });

  const result = await worker.ingest('test-source');
  expect(result.ok).toBe(true);
  expect(JSON.parse(await store.get('event-1')).score).toEqual({ home: 2, away: 1 });
  expect(JSON.parse(await index.get('events'))[0].id).toBe('event-1');
});
