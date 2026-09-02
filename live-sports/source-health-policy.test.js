import test from 'node:test';
import assert from 'node:assert/strict';
import { nextPollDelay } from './source-health-policy.js';

test('health facade preserves adaptive polling policy', () => {
  assert.equal(nextPollDelay({ eventStatus: 'live', sourceStatus: 'healthy', base: 40 }), 10);
});
