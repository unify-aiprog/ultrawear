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
      performances: payload.performances || [],
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

test('worker persists changed events, discovery index, team histories, and player histories', async () => {
  const store = memoryKv();
  const index = memoryKv();
  const teamHistory = memoryKv();
  const playerHistory = memoryKv();
  const worker = createLiveSportsWorker({
    env: { EVENT_STORE: store, EVENT_INDEX: index, TEAM_HISTORY: teamHistory, PLAYER_HISTORY: playerHistory },
    adapter,
    fetchSource: async () => ({
      id: 'event-1',
      home: 2,
      away: 1,
      performances: [{
        personId: 'player-1',
        teamId: 'home',
        opponentId: 'away',
        role: 'forward',
        started: true,
        minutes: 73,
        stats: { goals: 1, assists: 1 },
      }],
    }),
  });

  const result = await worker.ingest('test-source', { observedAt: '2026-09-02T19:42:00Z' });
  expect(result.ok).toBe(true);
  expect(JSON.parse(await store.get('event-1')).score).toEqual({ home: 2, away: 1 });
  expect(JSON.parse(await index.get('events'))[0].id).toBe('event-1');

  const homeMatches = JSON.parse(await teamHistory.get('team:home:matches'));
  const awayMatches = JSON.parse(await teamHistory.get('team:away:matches'));
  expect(homeMatches).toHaveLength(1);
  expect(awayMatches).toHaveLength(1);
  expect(homeMatches[0]).toMatchObject({ eventId: 'event-1', teamId: 'home', opponent: { id: 'away', name: 'Away' } });
  expect(awayMatches[0]).toMatchObject({ eventId: 'event-1', teamId: 'away', opponent: { id: 'home', name: 'Home' } });

  const playerEvents = JSON.parse(await playerHistory.get('player:player-1:events'));
  expect(playerEvents).toHaveLength(1);
  expect(playerEvents[0]).toMatchObject({
    eventId: 'event-1',
    personId: 'player-1',
    teamId: 'home',
    opponentId: 'away',
    minutes: 73,
    stats: { goals: 1, assists: 1 },
  });
});
