import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyResearchPack } from './fact-firewall.js';

test('research pack cannot pass without evidence and claims', () => {
  const result = verifyResearchPack({ opportunityId: 'op-1', evidence: [], claims: [] });
  assert.equal(result.status, 'needs_review');
});

test('unsupported claims cannot pass the trust gate', () => {
  const result = verifyResearchPack({
    opportunityId: 'op-1',
    evidence: [{ sourceId: 'source-a', sourceType: 'official', capturedAt: new Date().toISOString(), confidence: 0.95 }],
    claims: [{ id: 'claim-a', text: 'Claim A', evidenceIds: ['missing-source'] }],
  });
  assert.equal(result.status, 'needs_review');
  assert.deepEqual(result.unsupportedClaimIds, ['claim-a']);
});

test('contradictory evidence cannot pass the trust gate', () => {
  const result = verifyResearchPack({
    opportunityId: 'op-1',
    evidence: [
      { sourceId: 'source-a', sourceType: 'official', capturedAt: new Date().toISOString(), confidence: 0.95 },
      { sourceId: 'source-b', sourceType: 'secondary', capturedAt: new Date().toISOString(), confidence: 0.95 },
    ],
    claims: [{ id: 'claim-a', text: 'Claim A', evidenceIds: ['source-a'], contradictedBy: ['source-b'] }],
  });
  assert.equal(result.status, 'needs_review');
  assert.equal(result.conflicts.length, 1);
});
