import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createObservation, reconcile } from './contracts.ts';

describe('sports contracts', () => {
  it('normalizes confidence and preserves provenance', () => {
    const observation = createObservation({ id: 'obs-1', sourceId: 'official-feed', sourceType: 'official', observedAt: '2026-09-03T10:00:00Z', verification: 'verified', confidence: 4, payload: { homeScore: 2, awayScore: 1 } });
    assert.equal(observation.confidence, 1);
    assert.equal(observation.sourceId, 'official-feed');
  });
  it('accepts falsy payloads because provenance, not truthiness, is required', () => {
    assert.equal(createObservation({ id: 'zero', sourceId: 'feed', sourceType: 'official', observedAt: '2026-09-03T10:00:00Z', verification: 'verified', payload: 0 }).payload, 0);
  });
  it('prefers official observations but never hides a conflict', () => {
    const observations = [
      createObservation({ id: 'official', sourceId: 'official', sourceType: 'official', observedAt: '2026-09-03T10:00:00Z', verification: 'verified', confidence: 0.8, payload: { score: '2-1' } }),
      createObservation({ id: 'secondary', sourceId: 'secondary', sourceType: 'secondary', observedAt: '2026-09-03T10:01:00Z', verification: 'verified', confidence: 1, payload: { score: '2-0' } }),
    ];
    const result = reconcile(observations, (a, b) => a.score === b.score);
    assert.equal(result.status, 'conflicted');
    assert.equal(result.value, null);
    assert.deepEqual(result.conflicts, ['secondary']);
  });
  it('treats identical payloads as agreement even when provenance metadata differs', () => {
    const observations = [
      createObservation({ id: 'official-1', sourceId: 'official-a', sourceType: 'official', observedAt: '2026-09-03T10:00:00Z', verification: 'verified', confidence: 0.8, payload: { score: '2-1', status: 'completed' } }),
      createObservation({ id: 'secondary-1', sourceId: 'secondary-b', sourceType: 'secondary', observedAt: '2026-09-03T10:02:00Z', verification: 'verified', confidence: 1, payload: { score: '2-1', status: 'completed' } }),
    ];
    const result = reconcile(observations, (a, b) => a.score === b.score && a.status === b.status);
    assert.equal(result.status, 'verified');
    assert.deepEqual(result.observationIds, ['official-1', 'secondary-1']);
    assert.deepEqual(result.conflicts, []);
    assert.deepEqual(result.value, { score: '2-1', status: 'completed' });
  });
  it('detects genuinely conflicting payloads', () => {
    const observations = [
      createObservation({ id: 'official-2', sourceId: 'official-a', sourceType: 'official', observedAt: '2026-09-03T10:00:00Z', verification: 'verified', confidence: 1, payload: { score: '2-1' } }),
      createObservation({ id: 'secondary-2', sourceId: 'secondary-b', sourceType: 'secondary', observedAt: '2026-09-03T10:01:00Z', verification: 'verified', confidence: 1, payload: { score: '2-0' } }),
    ];
    const result = reconcile(observations, (a, b) => a.score === b.score);
    assert.equal(result.status, 'conflicted');
    assert.equal(result.value, null);
    assert.deepEqual(result.conflicts, ['secondary-2']);
  });
  it('ignores expired freshness windows', () => {
    const observation = createObservation({ id: 'expired', sourceId: 'feed', sourceType: 'official', observedAt: '2026-09-03T10:00:00Z', freshnessAt: '2026-09-03T10:05:00Z', verification: 'verified', confidence: 1, payload: { score: '2-1' } });
    const result = reconcile([observation], () => true, Date.parse('2026-09-03T10:06:00Z'));
    assert.equal(result.status, 'insufficient_evidence');
    assert.equal(result.value, null);
  });
  it('returns no value when every observation is stale', () => {
    const observation = createObservation({ id: 'stale', sourceId: 'feed', sourceType: 'secondary', observedAt: '2026-09-01T10:00:00Z', verification: 'stale', confidence: 1, payload: { score: '2-1' } });
    const result = reconcile([observation], () => true);
    assert.equal(result.status, 'insufficient_evidence');
    assert.equal(result.value, null);
  });
});
