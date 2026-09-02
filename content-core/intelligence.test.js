import assert from 'node:assert/strict';
import { createStoryOpportunities, clusterSignals } from './intelligence.js';
import { buildResearchPack, verifyResearchPack } from './fact-firewall.js';

const now = new Date().toISOString();
const base = {
  type: 'trend',
  source: 'test',
  observedAt: now,
  confidence: 0.9,
  location: 'Lagos, Nigeria',
  payload: { velocity: 0.9, relevance: 0.9, localRelevance: 0.8, culturalRelevance: 0.7 },
};

const a = { ...base, id: 'a', title: 'Nigeria wins a major sports final' };
const b = { ...base, id: 'b', title: 'Nigeria wins a major sports final' };

assert.equal(clusterSignals([a, b]).length, 1);
const opportunities = createStoryOpportunities([a, b]);
assert.equal(opportunities.length, 1);
assert.ok(opportunities[0].priority >= 0.7);

const pack = buildResearchPack({
  opportunity: opportunities[0],
  evidence: [{ sourceId: 'source-1', sourceType: 'official', capturedAt: now, confidence: 0.95 }],
  claims: [{ id: 'claim-1', text: 'The event happened.', evidenceIds: ['source-1'] }],
});
assert.equal(verifyResearchPack(pack).status, 'pass');

const blocked = buildResearchPack({
  opportunity: opportunities[0],
  evidence: [],
  claims: [{ id: 'claim-2', text: 'Unsupported claim.', evidenceIds: [] }],
});
assert.equal(verifyResearchPack(blocked).status, 'needs_review');

console.log('Content Core intelligence tests passed.');
