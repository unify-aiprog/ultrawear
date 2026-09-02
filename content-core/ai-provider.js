/** Provider-neutral AI boundary. No model/vendor SDK belongs in Content Core. */

export function createDraftRequest({ story, researchPack, claims, instructions = '' }) {
  if (!story || !researchPack) throw new TypeError('Story and research pack are required');
  return Object.freeze({
    storyId: story.id,
    type: story.type,
    title: story.title,
    canonicalSlug: story.canonicalSlug,
    researchPack,
    claims: [...claims],
    instructions,
  });
}

export function validateDraftResponse(response, claims) {
  if (!response || typeof response.title !== 'string' || typeof response.body !== 'string') {
    throw new TypeError('AI draft response must contain title and body');
  }
  const claimIds = new Set(claims.map((claim) => claim.id));
  const referencedClaimIds = Array.isArray(response.claimIds) ? response.claimIds : [];
  const unknown = referencedClaimIds.filter((id) => !claimIds.has(id));
  if (unknown.length) throw new Error(`Draft references unknown claims: ${unknown.join(', ')}`);
  return {
    title: response.title,
    body: response.body,
    claimIds: [...referencedClaimIds],
    generatedBy: response.generatedBy || 'ai-provider',
  };
}
