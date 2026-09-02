import test from 'node:test';
import assert from 'node:assert/strict';
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
    async list({ prefix }) {
      return { keys: [...values.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
    async delete(key) { values.delete(key); },
  };
}

function durableStore() {
  const values = new Map();
  return {
    async put(key, value) { values.set(key, value); },
    async list(prefix) { return [...values.entries()].filter(([key]) => key.startsWith(prefix)).map(([, value]) => value); },
    async delete(key) { values.delete(key); },
    values,
  };
}

test('worker persists changed events, discovery index, team histories, and player histories', async () => {
  const store = memoryKv();
  const index = memoryKv();
  const teamHistory = memoryKv();
  const playerHistory = memoryKv();
  const worker = createLiveSportsWorker({
    env: { EVENT_STORE: store, OBSERVATION_STORE: memoryKv(), EVENT_INDEX: index, TEAM_HISTORY: teamHistory, PLAYER_HISTORY: playerHistory },
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
  assert.equal(result.ok, true);
  assert.deepEqual(JSON.parse(await store.get('event-1')).score, { home: 2, away: 1 });
  assert.equal(JSON.parse(await index.get('events'))[0].id, 'event-1');

  const homeMatches = JSON.parse(await teamHistory.get('team:home:matches'));
  const awayMatches = JSON.parse(await teamHistory.get('team:away:matches'));
  assert.equal(homeMatches.length, 1);
  assert.equal(awayMatches.length, 1);
  assert.deepEqual(homeMatches[0], { eventId: 'event-1', teamId: 'home', opponent: { id: 'away', name: 'Away' } });
  assert.deepEqual(awayMatches[0], { eventId: 'event-1', teamId: 'away', opponent: { id: 'home', name: 'Home' } });

  const playerEvents = JSON.parse(await playerHistory.get('player:player-1:events'));
  assert.equal(playerEvents.length, 1);
  assert.deepEqual(playerEvents[0], {
    eventId: 'event-1',
    personId: 'player-1',
    teamId: 'home',
    opponentId: 'away',
    role: 'forward',
    started: true,
    minutes: 73,
    stats: { goals: 1, assists: 1 },
  });
});

test('worker exposes durable scheduling when a scheduler store is supplied', async () => {
  const schedulerStore = durableStore();
  const now = Date.parse('2026-09-02T12:00:00.000Z');
  const worker = createLiveSportsWorker({
    env: { EVENT_STORE: memoryKv(), OBSERVATION_STORE: memoryKv(), EVENT_INDEX: memoryKv(), TEAM_HISTORY: memoryKv(), PLAYER_HISTORY: memoryKv() },
    adapter,
    schedulerStore,
    now: () => now,
    fetchSource: async () => ({ id: 'event-scheduled', home: 1, away: 0 }),
  });

  assert.equal(typeof worker.schedule, 'function');
  assert.equal(typeof worker.runScheduled, 'function');
  assert.equal(typeof worker.listScheduled, 'function');

  const scheduled = await worker.schedule('test-source', { eventStatus: 'scheduled' }, 0);
  assert.equal(scheduled.sourceId, 'test-source');
  assert.equal((await worker.listScheduled()).length, 1);

  const results = await worker.runScheduled(now);
  assert.equal(results.length, 1);
  assert.equal(results[0].sourceId, 'test-source');
  assert.equal(results[0].ok, true);
  assert.equal(results[0].result.event.id, 'event-scheduled');
  assert.ok(Date.parse((await worker.listScheduled())[0].scheduledAt) > now);
});

test('worker remains directly ingestible without a durable scheduler', async () => {
  const worker = createLiveSportsWorker({
    env: { EVENT_STORE: memoryKv(), OBSERVATION_STORE: memoryKv(), EVENT_INDEX: memoryKv(), TEAM_HISTORY: memoryKv(), PLAYER_HISTORY: memoryKv() },
    adapter,
    fetchSource: async () => ({ id: 'event-direct', home: 0, away: 0 }),
  });

  const result = await worker.ingest('test-source', { observedAt: '2026-09-02T19:42:00Z' });
  assert.equal(result.ok, true);
  assert.equal(result.event.id, 'event-direct');
  assert.equal(worker.runScheduled, undefined);
});
