import test from 'node:test';
import assert from 'node:assert/strict';
import { createScheduledExecution, runScheduledExecution } from './scheduled-execution.js';

test('scheduled execution hydrates, runs due ingestion, and drains revalidation', async () => {
  const calls = [];
  const worker = {
    async hydrate() { calls.push('hydrate'); },
    async runScheduled(at) { calls.push(['scheduled', at]); return [{ sourceId: 'source-a', ok: true, delaySeconds: 8 }]; },
    async drainRevalidation() { calls.push('revalidation'); return { results: [{ sourceId: 'source-b', ok: true }], errors: [], pending: 0 }; },
  };
  const at = Date.parse('2026-09-02T12:00:00.000Z');
  const execution = createScheduledExecution({ worker });

  const result = await execution.run(at);

  assert.deepEqual(calls, ['hydrate', ['scheduled', at], 'revalidation']);
  assert.deepEqual(result, {
    ok: true,
    at: '2026-09-02T12:00:00.000Z',
    results: [{ sourceId: 'source-a', ok: true, delaySeconds: 8 }],
    revalidation: { results: [{ sourceId: 'source-b', ok: true }], errors: [], pending: 0 },
  });
});

test('scheduled execution remains compatible with workers without revalidation', async () => {
  const calls = [];
  const worker = {
    async hydrate() { calls.push('hydrate'); },
    async runScheduled(at) { calls.push(at); return []; },
  };
  const at = Date.parse('2026-09-02T12:00:00.000Z');
  const result = await runScheduledExecution({ worker, at });
  assert.deepEqual(calls, ['hydrate', at]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.results, []);
  assert.deepEqual(result.revalidation, { results: [], errors: [], pending: 0 });
});
