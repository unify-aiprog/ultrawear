import test from 'node:test';
import assert from 'node:assert/strict';
import { createFactAuditRecord, factAuditAction } from './fact-audit.js';
import { createFactAuditStore } from './fact-audit-store.js';

function memoryStore() {
  const values = new Map();
  return { values, async put(key, value) { values.set(key, value); }, async get(key) { return values.get(key) ?? null; }, async list(prefix) { return [...values.keys()].filter((key) => key.startsWith(prefix)); } };
}

const base = { entityId: 'event:1', entityType: 'event', field: 'score', sourceId: 'source-a', observedAt: '2026-09-02T12:00:00Z' };

test('fact audit classifies the canonical transition lifecycle', () => {
  const unverified = { verification: 'unverified', value: { home: 1, away: 0 }, sources: ['a'] };
  const corroborated = { verification: 'corroborated', value: { home: 1, away: 0 }, sources: ['a', 'b'] };
  const conflicted = { verification: 'conflicted', value: { home: 1, away: 0 }, sources: ['a', 'b'] };
  assert.equal(factAuditAction({ after: unverified }), 'accepted');
  assert.equal(factAuditAction({ before: unverified, after: corroborated }), 'reverified');
  assert.equal(factAuditAction({ before: unverified, after: conflicted }), 'conflicted');
  assert.equal(factAuditAction({ before: conflicted, after: corroborated }), 'corrected');
  assert.equal(factAuditAction({ before: unverified, after: { ...unverified, value: { home: 2, away: 0 } }, previousValue: unverified.value }), 'changed');
});

test('fact audit records preserve provenance and prior verification', () => {
  const record = createFactAuditRecord({ ...base, before: { verification: 'conflicted' }, after: { verification: 'corroborated', value: 2, sources: ['a', 'b'] }, previousValue: 1, reason: 'reverification' });
  assert.equal(record.action, 'corrected');
  assert.equal(record.previousValue, 1);
  assert.equal(record.previousVerification, 'conflicted');
  assert.deepEqual(record.sources, ['a', 'b']);
});

test('fact audit store persists and filters records deterministically', async () => {
  const audit = createFactAuditStore(memoryStore());
  await audit.putAudit(createFactAuditRecord({ ...base, after: { verification: 'unverified', value: 1, sources: ['source-a'] } }));
  await audit.putAudit(createFactAuditRecord({ ...base, field: 'status', observedAt: '2026-09-02T12:01:00Z', after: { verification: 'unverified', value: 'live', sources: ['source-a'] } }));
  const score = await audit.listAudits({ entityId: 'event:1', field: 'score' });
  assert.equal(score.length, 1);
  assert.equal(score[0].field, 'score');
});
