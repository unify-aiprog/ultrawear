import { transitionStory } from './pipeline.js';
import { verifyResearchPack } from './fact-firewall.js';
import { appendStoryAudit, saveStory } from './store.js';

export async function advanceStory(story, to, { actor, reason = '', researchPack = null } = {}) {
  if (to === 'approved' || to === 'published') {
    if (!researchPack) throw new Error('A verified research pack is required before approval or publication');
    const verification = verifyResearchPack(researchPack);
    if (verification.status !== 'pass') throw new Error('Editorial trust gate failed');
  }

  const result = transitionStory(story, to, { actor, reason });
  await saveStory(result.story);
  await appendStoryAudit({ storyId: story.id, action: result.audit.action, actor, reason, fromState: result.audit.from, toState: result.audit.to });
  return result;
}
