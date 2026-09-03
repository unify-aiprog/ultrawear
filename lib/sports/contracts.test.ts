import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createObservation, reconcile } from './contracts';

describe('sports contracts', () => {
  it('normalizes confidence and preserves provenance', () => {
    const observation = createObservation({
      id: 'obs-1',
      sourceId: 'official-feed',
      sourceType: 'official',
      observedAt: '2026-09-03T10:00:00Z',
      verification: 'verified',
      confidence: 4,
      payload: { homeScore: 2, awayScore: 1 },
    });

    assert.equal(observation.confidence, 1);
    assert.equal(observation.sourceId, 'official-feed');
  });

  it('refuses to publish a conflicted value', () => {
    const observations = [
      createObservation({ id: 'a', sourceId: 'official', sourceType: 'official', observedAt: '2026-09-03T10:00:00Z', verification: 'verified', confidence: 0.9, payload: { score: '2-1' } }),
      createObservation({ id: 'b', sourceId: 'secondary', sourceType: 'secondary', observedAt: '2026-09-03T10:01:00Z', verification: 'verified', confidence: 0.8, payload: { score: '2-0' } }),
    ];

    const result = reconcile(observations, (a, b) => a.score === b.score);
    assert.equal(result.status, 'conflicted');
    assert.equal(result.value, null);
    assert.deepEqual(result.conflicts, ['b']);
  });

  it('returns no value when every observation is stale', () => {
    const observation = createObservation({ id: 'stale', sourceId: 'feed', sourceType: 'secondary', observedAt: '2026-09-01T10:00:00Z', verification: 'stale', confidence: 1, payload: { score: '2-1' } });
    const result = reconcile([observation], () => true);
    assert.equal(result.status, 'insufficient_evidence');
    assert.equal(result.value, null);
  });
});
