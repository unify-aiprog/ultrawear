import assert from 'node:assert/strict';
import test from 'node:test';
import { assessSource, shouldSurfaceEvent } from './source-monitor.js';

const baseEvent = {
  status: 'live',
  updatedAt: '2026-09-02T18:42:00.000Z',
};

test('marks recent live data healthy', () => {
  const health = assessSource({
    sourceId: 'sportradar-soccer',
    checkedAt: '2026-09-02T18:42:01.000Z',
    observedAt: '2026-09-02T18:42:00.000Z',
    event: baseEvent,
    now: Date.parse('2026-09-02T18:42:30.000Z'),
  });
  assert.equal(health.status, 'healthy');
});

test('marks old live data stale', () => {
  const health = assessSource({
    sourceId: 'sportradar-soccer',
    checkedAt: '2026-09-02T18:46:01.000Z',
    observedAt: '2026-09-02T18:42:00.000Z',
    event: baseEvent,
    now: Date.parse('2026-09-02T18:46:30.000Z'),
  });
  assert.equal(health.status, 'stale');
  assert.equal(shouldSurfaceEvent(baseEvent, Date.parse('2026-09-02T18:46:30.000Z')), false);
});

test('marks transport failures offline', () => {
  const health = assessSource({
    sourceId: 'sportradar-soccer',
    checkedAt: '2026-09-02T18:46:01.000Z',
    error: new Error('upstream unavailable'),
  });
  assert.equal(health.status, 'offline');
});
