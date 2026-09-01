import assert from 'node:assert/strict';
import { createDraftRequest, validateDraftResponse } from './ai-provider.js';

const story = { id: 'story-1', type: 'explainer', title: 'Test', canonicalSlug: 'test' };
const pack = { opportunityId: 'opp-1', claims: [] };
const claim = { id: 'claim-1', text: 'Verified fact', status: 'supported' };

const request = createDraftRequest({ story, researchPack: pack, claims: [claim] });
assert.equal(request.storyId, 'story-1');

const valid = validateDraftResponse({ title: 'Draft', body: 'Body', claimIds: ['claim-1'] }, [claim]);
assert.deepEqual(valid.claimIds, ['claim-1']);
assert.throws(() => validateDraftResponse({ title: 'Draft', body: 'Body', claimIds: ['missing'] }, [claim]), /unknown claims/);

console.log('ai-provider tests passed');
