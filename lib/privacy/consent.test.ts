import test from 'node:test';
import assert from 'node:assert/strict';
import { canTrack, consentedCoarseLocation } from './consent.ts';

test('system records cannot grant tracking consent', () => {
  assert.equal(canTrack('personalization', [{ purpose: 'personalization', state: 'granted', recordedAt: new Date().toISOString(), source: 'system' }]), false);
});

test('latest user denial overrides an earlier grant', () => {
  assert.equal(canTrack('analytics', [
    { purpose: 'analytics', state: 'granted', recordedAt: '2026-01-01T00:00:00Z', source: 'user' },
    { purpose: 'analytics', state: 'denied', recordedAt: '2026-02-01T00:00:00Z', source: 'user' },
  ]), false);
});

test('invalid timestamps cannot become the latest consent decision', () => {
  assert.equal(canTrack('advertising', [
    { purpose: 'advertising', state: 'granted', recordedAt: 'not-a-date', source: 'user' },
  ]), false);
});

test('coarse location remains unavailable without explicit personalization consent', () => {
  const location = { country: 'NG', region: 'Lagos', precise: true };
  assert.deepEqual(consentedCoarseLocation([], location), null);
  assert.deepEqual(consentedCoarseLocation([
    { purpose: 'personalization', state: 'granted', recordedAt: '2026-01-01T00:00:00Z', source: 'user' },
  ], location), { country: 'NG', region: 'Lagos' });
});
