import assert from 'node:assert/strict';
import test from 'node:test';
import { createSportEvent } from './events.js';
import { createSourceAdapter } from './adapter.js';
import { createFollow } from './follow.js';
import { createSourceRegistry } from './registry.js';

test('registry emits deterministic alert candidates when an event changes', () => {
  const registry = createSourceRegistry({
    follows: [
      createFollow({ userId: 'u1', type: 'event', targetId: 'event-1' }),
      createFollow({ userId: 'u1', type: 'team', targetId: 'home' }),
    ],
  });

  registry.register(createSourceAdapter({
    id: 'source',
    name: 'Source',
    normalize: (payload) => createSportEvent({ ...payload, source: { id: 'source' } }),
  }));

  const base = {
    id: 'event-1',
    sport: 'football',
    competition: 'League',
    home: { id: 'home', name: 'Home' },
    away: { id: 'away', name: 'Away' },
    startsAt: '2026-09-01T18:00:00Z',
    status: 'scheduled',
    score: { home: 0, away: 0 },
    updatedAt: '2026-09-01T17:59:00Z',
  };

  const first = registry.ingest('source', base, { createdAt: '2026-09-01T18:00:00Z' });
  assert.equal(first.alertCandidates.length, 0);

  const started = registry.ingest('source', {
    ...base,
    status: 'live',
    updatedAt: '2026-09-01T18:01:00Z',
  }, { createdAt: '2026-09-01T18:01:01Z' });

  assert.equal(started.alertCandidates.length, 2);
  assert.deepEqual(
    started.alertCandidates.map((candidate) => [candidate.follow.type, candidate.reason, candidate.priority]),
    [['event', 'event_started', 'high'], ['team', 'event_started', 'high']],
  );

  const unchanged = registry.ingest('source', {
    ...base,
    status: 'live',
    updatedAt: '2026-09-01T18:01:00Z',
  }, { createdAt: '2026-09-01T18:01:02Z' });
  assert.equal(unchanged.alertCandidates.length, 0);
});
