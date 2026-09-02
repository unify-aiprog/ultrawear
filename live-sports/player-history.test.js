import { createPlayerHistoryStore } from './player-history.js';

function memoryKv() {
  const data = new Map();
  return {
    async get(key) { return data.get(key) || null; },
    async put(key, value) { data.set(key, value); },
  };
}

const event = {
  id: 'event-1',
  sport: 'Football',
  competition: 'Premier League',
  startsAt: '2026-09-02T19:00:00Z',
  status: 'finished',
  updatedAt: '2026-09-02T21:00:00Z',
};

const store = createPlayerHistoryStore(memoryKv());
const saved = await store.put(event, 'player-1', {
  teamId: 'arsenal',
  opponentId: 'chelsea',
  role: 'forward',
  started: true,
  minutes: 90,
  stats: { goals: 1, assists: 1 },
});

if (saved.eventId !== 'event-1' || saved.minutes !== 90) {
  throw new Error('Player event summary was not normalized');
}

const history = await store.list('player-1');
if (history.length !== 1 || history[0].stats.goals !== 1) {
  throw new Error('Player event history was not persisted');
}
