import test from 'node:test';
import assert from 'node:assert/strict';
import { createScheduledExecution, runScheduledExecution } from './scheduled-execution.js';

test('scheduled execution delegates to the worker and returns a stable result envelope', async () => {
  const calls = [];
  const worker = {
    async runScheduled(at) {
      calls.push(at);
      return [{ sourceId: 'source-a', ok: true, delaySeconds: 8 }];
    },
  };
  const at = Date.parse('2026-09-02T12:00:00.000Z');
  const execution = createScheduledExecution({ worker });

  const result = await execution.run(at);

  assert.deepEqual(calls, [at]);
  assert.deepEqual(result, {
    ok: true,
    at: '2026-09-02T12:00:00.000Z',
    results: [{ sourceId: 'source-a', ok: true, delaySeconds: 8 }],
  });
});

test('standalone scheduled execution uses the same boundary', async () => {
  const worker = { runScheduled: async () => [] };
  const result = await runScheduledExecution({ worker, at: Date.parse('2026-09-02T12:00:00.000Z') });
  assert.equal(result.ok, true);
  assert.deepEqual(result.results, []);
});
