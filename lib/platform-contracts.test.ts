import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canTrack, coarseLocation } from './privacy/consent.ts';
import { canModerate } from './community/moderation.ts';
import { normalizeLocation, scoreTrend } from './trends/contracts.ts';
import { requireCommercialDisclosure } from './commerce/editorial-separation.ts';

describe('constitutional platform contracts', () => {
  it('requires explicit consent for tracking and coarse-grains location', () => {
    assert.equal(canTrack('analytics', []), false);
    assert.equal(canTrack('analytics', [{ purpose: 'analytics', state: 'granted', recordedAt: '2026-09-03T10:00:00Z', source: 'user' }]), true);
    assert.deepEqual(coarseLocation({ country: 'NG', region: 'LA', precise: true }), { country: 'NG', region: 'LA' });
    assert.deepEqual(coarseLocation({ country: 'NG', region: 'LA', precise: false }), { country: 'NG', region: null });
  });

  it('keeps community moderation transitions explicit', () => {
    assert.equal(canModerate('pending', 'approved'), true);
    assert.equal(canModerate('pending', 'removed'), false);
  });

  it('normalizes trend scoring and rejects missing near-you scope', () => {
    assert.throws(() => normalizeLocation('near_you'), /coarse location/);
    assert.deepEqual(scoreTrend({ velocity: 2, confidence: 0.8, relevance: 0.4 } as any), { velocity: 1, confidence: 0.8, relevance: 0.4, score: 0.76 });
  });

  it('requires disclosure for commercial content', () => {
    assert.throws(() => requireCommercialDisclosure({ label: 'sponsored', disclosure: '', editorialIndependence: true }), /disclosure/);
    assert.doesNotThrow(() => requireCommercialDisclosure({ label: 'affiliate', disclosure: 'Affiliate link', editorialIndependence: true }));
  });
});
