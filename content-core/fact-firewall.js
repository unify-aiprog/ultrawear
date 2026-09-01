import { clampScore, createEvidence } from './contracts.js';

export function buildResearchPack({ opportunity, evidence = [], claims = [], openQuestions = [] }) {
  if (!opportunity?.id) throw new TypeError('Opportunity is required');
  return {
    opportunityId: opportunity.id,
    evidence: evidence.map(createEvidence),
    claims: claims.map(normalizeClaim),
    openQuestions: [...new Set(openQuestions.map(String).map((q) => q.trim()).filter(Boolean))],
    status: 'unverified',
    createdAt: new Date().toISOString(),
  };
}

export function verifyResearchPack(pack, options = {}) {
  const minimumConfidence = clampScore(options.minimumConfidence ?? 0.6);
  const evidenceBySource = new Set((pack.evidence || []).map((item) => item.sourceId));
  const results = (pack.claims || []).map((claim) => {
    const supporting = (claim.evidenceIds || []).filter((id) => evidenceBySource.has(id));
    const evidence = (pack.evidence || []).filter((item) => supporting.includes(item.sourceId));
    const maxConfidence = evidence.reduce((max, item) => Math.max(max, item.confidence), 0);
    return { claimId: claim.id, supported: supporting.length > 0, confidence: maxConfidence };
  });

  const unsupported = results.filter((result) => !result.supported);
  const lowConfidence = results.filter((result) => result.supported && result.confidence < minimumConfidence);
  const conflicting = detectConflicts(pack);

  return {
    status: conflicting.length || unsupported.length || lowConfidence.length ? 'needs_review' : 'pass',
    results,
    unsupportedClaimIds: unsupported.map((item) => item.claimId),
    lowConfidenceClaimIds: lowConfidence.map((item) => item.claimId),
    conflicts: conflicting,
    checkedAt: new Date().toISOString(),
  };
}

function normalizeClaim(claim) {
  if (!claim?.id || !claim.text) throw new TypeError('Invalid research claim');
  return {
    id: String(claim.id),
    text: String(claim.text).trim(),
    evidenceIds: [...new Set((claim.evidenceIds || []).map(String))],
  };
}

function detectConflicts(pack) {
  const conflicts = [];
  for (const claim of pack.claims || []) {
    const contradictory = (claim.contradictedBy || []).filter((id) =>
      (pack.evidence || []).some((evidence) => evidence.sourceId === id),
    );
    if (contradictory.length) conflicts.push({ claimId: claim.id, evidenceIds: contradictory });
  }
  return conflicts;
}
