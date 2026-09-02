import test from 'node:test';
import assert from 'node:assert/strict';
import { createIngestionHealth } from './ingestion-health.js';

test('ingestion health records successful and failed observations', () => {
  const health = createIngestionHealth({ now: () => Date.parse('2026-09-02T12:00:00Z') });
  assert.equal(health.record({ sourceId: 'demo', ok: true, observedAt: '2026-09-02T11:59:55Z', event: { status: 'live' } }).status, 'healthy');
  health.record({ sourceId: 'demo', ok: false, observedAt: '2026-09-02T11:59:55Z', event: { status: 'live' } });
  assert.equal(health.get('demo').status, 'degraded');
});
