import { transitionStory } from './pipeline.js';
import { verifyResearchPack } from './fact-firewall.js';
import { transitionStoryAtomically } from './store.js';

export async function advanceStory(story, to, { actor, reason = '', researchPack = null } = {}) {
  if (to === 'approved' || to === 'published') {
    if (!researchPack) throw new Error('A verified research pack is required before approval or publication');
    const verification = verifyResearchPack(researchPack);
    if (verification.status !== 'pass') throw new Error('Editorial trust gate failed');
  }

  const result = transitionStory(story, to, { actor, reason });
  const persistedStory = await transitionStoryAtomically({
    storyId: story.id,
    toState: result.story.state,
    actor,
    reason,
    publishedAt: result.story.publishedAt,
  });
  return {
    story: persistedStory,
    audit: { ...result.audit, story: persistedStory },
  };
}
