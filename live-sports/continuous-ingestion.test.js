import test from 'node:test';
import assert from 'node:assert/strict';
import { createContinuousIngestionScheduler } from './continuous-ingestion.js';

test('scheduler starts one polling loop per source', () => {
  const scheduler = createContinuousIngestionScheduler({ ingest: async () => ({ event: { status: 'live' }, health: { status: 'healthy' } }) });
  assert.equal(scheduler.start([{ sourceId: 'source-a', baseDelay: 5 }]), 1);
  assert.equal(scheduler.pending(), 1);
  scheduler.stop();
  assert.equal(scheduler.pending(), 0);
});
