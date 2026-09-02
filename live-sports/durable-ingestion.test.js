import test from 'node:test';
import assert from 'node:assert/strict';
import { createDurableIngestionCoordinator } from './durable-ingestion.js';

function memoryScheduler(now) {
  const data = new Map();
  return {
    data,
    async schedule(sourceId, context, delaySeconds) {
      const item = { sourceId, context, scheduledAt: new Date(now() + delaySeconds * 1000).toISOString(), updatedAt: new Date(now()).toISOString() };
      data.set(sourceId, item);
      return item;
    },
    async due(at = now()) {
      return [...data.values()].filter((item) => Date.parse(item.scheduledAt) <= at);
    },
  };
}

test('durable coordinator adapts the next poll to event and source health', async () => {
  let clock = Date.parse('2026-09-02T12:00:00.000Z');
  const now = () => clock;
  const scheduler = memoryScheduler(now);
  await scheduler.schedule('source-a', { eventStatus: 'scheduled' }, 0);
  const coordinator = createDurableIngestionCoordinator({
    scheduler,
    now,
    ingest: async () => ({ ok: true, event: { status: 'live' }, health: { status: 'healthy' } }),
  });

  const results = await coordinator.runDue(clock);
  assert.equal(results.length, 1);
  assert.equal(results[0].delaySeconds, 8);
  assert.equal(scheduler.data.get('source-a').context.eventStatus, 'live');
});

test('durable coordinator preserves failed work with a retry state', async () => {
  let clock = Date.parse('2026-09-02T12:00:00.000Z');
  const now = () => clock;
  const scheduler = memoryScheduler(now);
  await scheduler.schedule('source-b', { eventStatus: 'scheduled' }, 0);
  const coordinator = createDurableIngestionCoordinator({
    scheduler,
    now,
    ingest: async () => { throw new Error('provider unavailable'); },
  });

  const results = await coordinator.runDue(clock);
  assert.equal(results[0].ok, false);
  assert.equal(scheduler.data.get('source-b').context.sourceStatus, 'degraded');
  assert.equal(scheduler.data.get('source-b').context.lastError, 'provider unavailable');
});
