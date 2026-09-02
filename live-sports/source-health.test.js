import test from 'node:test';
import assert from 'node:assert/strict';
import { classifySourceHealth, createSourceHealthTracker, nextPollDelay } from './source-health.js';

const NOW = Date.parse('2026-09-02T12:00:00.000Z');
const iso = (seconds) => new Date(NOW - seconds * 1000).toISOString();

test('live source becomes degraded then stale as observations age', () => {
  assert.equal(classifySourceHealth({ status: 'live', observedAt: iso(20), checkedAt: iso(20), now: NOW }), 'healthy');
  assert.equal(classifySourceHealth({ status: 'live', observedAt: iso(45), checkedAt: iso(45), now: NOW }), 'degraded');
  assert.equal(classifySourceHealth({ status: 'live', observedAt: iso(70), checkedAt: iso(70), now: NOW }), 'stale');
});

test('repeated failures move a source offline', () => {
  const tracker = createSourceHealthTracker({ now: () => NOW });
  tracker.record({ sourceId: 'demo', eventStatus: 'live', observedAt: iso(5), ok: false });
  tracker.record({ sourceId: 'demo', eventStatus: 'live', observedAt: iso(5), ok: false });
  assert.equal(tracker.record({ sourceId: 'demo', eventStatus: 'live', observedAt: iso(5), ok: false }).status, 'offline');
});

test('polling is faster for live events and backs off unhealthy sources', () => {
  assert.equal(nextPollDelay({ eventStatus: 'live', sourceStatus: 'healthy', base: 40 }), 10);
  assert.equal(nextPollDelay({ eventStatus: 'live', sourceStatus: 'degraded', base: 40 }), 20);
  assert.equal(nextPollDelay({ eventStatus: 'scheduled', sourceStatus: 'healthy', base: 40 }), 40);
});
