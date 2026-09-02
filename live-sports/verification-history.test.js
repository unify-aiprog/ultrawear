import test from 'node:test';
import assert from 'node:assert/strict';
import { createVerificationHistory } from './verification-history.js';

test('verification history returns deterministic event audit records with a bounded limit', async () => {
  const auditStore = {
    async listAudits() {
      return [
        { id: 'b', entityId: 'event:1', entityType: 'event', field: 'score', action: 'changed', sourceId: 'source-b', observedAt: '2026-09-02T12:01:00Z', previousValue: 1, value: 2, previousVerification: 'unverified', verification: 'unverified', sources: ['source-b'], reason: 'canonical reconciliation' },
        { id: 'a', entityId: 'event:1', entityType: 'event', field: 'score', action: 'accepted', sourceId: 'source-a', observedAt: '2026-09-02T12:00:00Z', previousValue: null, value: 1, previousVerification: null, verification: 'unverified', sources: ['source-a'], reason: 'canonical reconciliation' },
      ];
    },
  };

  const history = createVerificationHistory({ auditStore });
  const records = await history.forEvent('event:1', { limit: 1 });
  assert.equal(records.length, 1);
  assert.equal(records[0].id, 'b');
  assert.equal(records[0].previousVerification, 'unverified');
  assert.equal(records[0].value, 2);
});

test('verification history forwards field filters to the audit store', async () => {
  let request = null;
  const history = createVerificationHistory({ auditStore: { async listAudits(options) { request = options; return []; } } });
  await history.forEvent('event:2', { field: 'status', limit: 20 });
  assert.deepEqual(request, { entityId: 'event:2', field: 'status' });
});
