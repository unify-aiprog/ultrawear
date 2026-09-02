import { CONTENT_STATES } from './contracts.js';

const TRANSITIONS = Object.freeze({
  opportunity: ['researching', 'archived'],
  researching: ['drafting', 'archived'],
  drafting: ['verifying', 'archived'],
  verifying: ['review', 'drafting', 'archived'],
  review: ['approved', 'drafting', 'archived'],
  approved: ['published', 'review'],
  published: ['refresh_due', 'archived'],
  refresh_due: ['researching', 'archived'],
  archived: [],
});

export function canTransition(from, to) {
  if (!CONTENT_STATES.includes(from) || !CONTENT_STATES.includes(to)) return false;
  return TRANSITIONS[from].includes(to);
}

export function transitionStory(story, to, { actor, reason = '' } = {}) {
  if (!story || !actor) throw new TypeError('Story and actor are required');
  if (!canTransition(story.state, to)) {
    throw new Error(`Invalid content transition: ${story.state} -> ${to}`);
  }

  const now = new Date().toISOString();
  const next = {
    ...story,
    state: to,
    updatedAt: now,
    publishedAt: to === 'published' ? (story.publishedAt || now) : story.publishedAt,
  };

  return {
    story: next,
    audit: {
      action: 'state_transition',
      storyId: story.id,
      from: story.state,
      to,
      actor,
      reason,
      at: now,
    },
  };
}

export function getAllowedTransitions(state) {
  return [...(TRANSITIONS[state] || [])];
}
