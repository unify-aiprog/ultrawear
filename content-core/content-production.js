/**
 * Phase 2: provider-neutral production workflow.
 *
 * Turns verified opportunities into draftable, traceable stories without
 * allowing unsupported claims to silently reach publication.
 */

import { createEvidence, createStory } from './contracts.js';
import { canTransition, transitionStory } from './pipeline.js';

export function createResearchPack({ opportunityId, query = '', sources = [], claims = [], openQuestions = [] }) {
  if (!opportunityId) throw new TypeError('opportunityId is required');
  return {
    opportunityId,
    query,
    sources: [...sources],
    claims: [...claims],
    openQuestions: [...openQuestions],
    createdAt: new Date().toISOString(),
  };
}

export function createClaim({ id, text, evidenceIds = [], confidence = 0, status = 'unverified' }) {
  if (!id || !text) throw new TypeError('Claim id and text are required');
  if (!['unverified', 'supported', 'conflict', 'blocked'].includes(status)) {
    throw new TypeError('Invalid claim status');
  }
  return { id, text, evidenceIds: [...evidenceIds], confidence, status };
}

export function verifyClaims(claims, evidence) {
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  return claims.map((claim) => {
    const supporting = claim.evidenceIds.map((id) => evidenceById.get(id)).filter(Boolean);
    const valid = supporting.length > 0 && supporting.every((item) => item.confidence >= 0.7);
    return {
      ...claim,
      status: valid ? 'supported' : 'blocked',
      evidenceCount: supporting.length,
    };
  });
}

export function createDraft({ storyId, title, dek = '', body = '', claims = [], generatedBy = 'editor' }) {
  if (!storyId || !title) throw new TypeError('storyId and title are required');
  return {
    storyId,
    title,
    dek,
    body,
    claims: [...claims],
    generatedBy,
    createdAt: new Date().toISOString(),
    revision: 1,
  };
}

export function reviewDraft(draft, claims) {
  const blocked = claims.filter((claim) => claim.status !== 'supported');
  return {
    ...draft,
    review: {
      status: blocked.length ? 'needs_review' : 'ready_for_editor',
      blockedClaimIds: blocked.map((claim) => claim.id),
      checkedAt: new Date().toISOString(),
    },
  };
}

export function publishable(draft) {
  return Boolean(draft?.review?.status === 'ready_for_editor');
}

export function createProductionStory({ id, type, title, canonicalSlug, signalIds = [], entities = [] }) {
  return createStory({ id, type, title, canonicalSlug, signalIds, entities });
}

export function advanceStory(story, to, actor, reason = '') {
  if (!canTransition(story.state, to)) {
    throw new Error(`Story cannot move from ${story.state} to ${to}`);
  }
  return transitionStory(story, to, { actor, reason });
}

export { createEvidence };
