import test from 'node:test';
import assert from 'node:assert/strict';
import { createDurableIngestionCoordinator } from './durable-ingestion.js';

function memoryScheduler(now, { claim = null } = {}) {
  const data = new Map();
  return {
    data,
    async schedule(sourceId, context, delaySeconds) {
      const item = { sourceId, context, scheduledAt: new Date(now() + delaySeconds * 1000).toISOString(), updatedAt: new Date(now()).toISOString() };
      data.set(sourceId, item);
      return item;
    },
    async due(at = now()) { return [...data.values()].filter((item) => Date.parse(item.scheduledAt) <= at); },
    ...(claim ? { claim } : {}),
  };
}

test('durable coordinator adapts the next poll to event and source health', async () => {
  const now = () => Date.parse('2026-09-02T12:00:00.000Z');
  const scheduler = memoryScheduler(now);
  await scheduler.schedule('source-a', { eventStatus: 'scheduled' }, 0);
  const coordinator = createDurableIngestionCoordinator({ scheduler, now, ingest: async () => ({ ok: true, event: { status: 'live' }, health: { status: 'healthy' } }) });
  const results = await coordinator.runDue(now());
  assert.equal(results.length, 1);
  assert.equal(results[0].delaySeconds, 8);
  assert.equal(scheduler.data.get('source-a').context.eventStatus, 'live');
});

test('durable coordinator preserves failed work with a retry state', async () => {
  const now = () => Date.parse('2026-09-02T12:00:00.000Z');
  const scheduler = memoryScheduler(now);
  await scheduler.schedule('source-b', { eventStatus: 'scheduled' }, 0);
  const coordinator = createDurableIngestionCoordinator({ scheduler, now, ingest: async () => { throw new Error('provider unavailable'); } });
  const results = await coordinator.runDue(now());
  assert.equal(results[0].ok, false);
  assert.equal(results[0].claimed, true);
  assert.equal(scheduler.data.get('source-b').context.sourceStatus, 'degraded');
  assert.equal(scheduler.data.get('source-b').context.lastError, 'provider unavailable');
});

test('durable coordinator skips a due item when atomic claim is rejected', async () => {
  const now = () => Date.parse('2026-09-02T12:00:00.000Z');
  let calls = 0;
  const scheduler = memoryScheduler(now, { claim: async () => false });
  await scheduler.schedule('source-c', {}, 0);
  const coordinator = createDurableIngestionCoordinator({ scheduler, now, ingest: async () => { calls += 1; return { ok: true }; } });
  const results = await coordinator.runDue(now());
  assert.equal(calls, 0);
  assert.deepEqual(results, [{ sourceId: 'source-c', ok: false, claimed: false, skipped: true }]);
});

test('durable coordinator passes lease options to an atomic claim and reschedules after success', async () => {
  const now = () => Date.parse('2026-09-02T12:00:00.000Z');
  const claims = [];
  const scheduler = memoryScheduler(now, { claim: async (sourceId, options) => { claims.push([sourceId, options]); return true; } });
  await scheduler.schedule('source-d', { eventStatus: 'scheduled' }, 0);
  const coordinator = createDurableIngestionCoordinator({ scheduler, now, leaseSeconds: 45, ingest: async () => ({ ok: true, event: { status: 'live' }, health: { status: 'healthy' } }) });
  const results = await coordinator.runDue(now());
  assert.equal(results[0].claimed, true);
  assert.deepEqual(claims, [['source-d', { at: now(), leaseSeconds: 45 }]]);
  assert.equal(scheduler.data.get('source-d').context.eventStatus, 'live');
  assert.ok(Date.parse(scheduler.data.get('source-d').scheduledAt) > now());
});
