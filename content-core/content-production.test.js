import assert from 'node:assert/strict';
import {
  createClaim,
  createDraft,
  createResearchPack,
  reviewDraft,
  verifyClaims,
  publishable,
} from './content-production.js';

const evidence = [
  { id: 'official-1', confidence: 0.95 },
  { id: 'weak-1', confidence: 0.4 },
];

const supported = createClaim({
  id: 'claim-1',
  text: 'Verified event detail',
  evidenceIds: ['official-1'],
});

const weak = createClaim({
  id: 'claim-2',
  text: 'Unconfirmed detail',
  evidenceIds: ['weak-1'],
});

const checked = verifyClaims([supported, weak], evidence);
assert.equal(checked[0].status, 'supported');
assert.equal(checked[1].status, 'blocked');

const pack = createResearchPack({
  opportunityId: 'opp-1',
  query: 'event verification',
  claims: checked,
});
assert.equal(pack.opportunityId, 'opp-1');

const draft = createDraft({
  storyId: 'story-1',
  title: 'Verified story',
  claims: checked,
});

const blockedReview = reviewDraft(draft, checked);
assert.equal(blockedReview.review.status, 'needs_review');
assert.equal(publishable(blockedReview), false);

const cleanReview = reviewDraft(draft, [checked[0]]);
assert.equal(cleanReview.review.status, 'ready_for_editor');
assert.equal(publishable(cleanReview), true);

console.log('content-production tests passed');
