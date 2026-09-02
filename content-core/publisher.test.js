import assert from 'node:assert/strict';
import { approveStory, createCorrection, createPublishRecord, createRevision, publishStory } from './publisher.js';

const revision = createRevision({ storyId: 'story-1', revision: 1, title: 'UltraWear story', body: 'Verified body', editor: 'editor-1' });
const record = createPublishRecord({ storyId: 'story-1', canonicalUrl: '/news/story-1', revision: 1 });

assert.throws(() => publishStory({ publishRecord: record, revision: 1, publisher: 'system' }), /approved/);

const approved = approveStory({ publishRecord: record, editor: 'editor-1', revision: revision.revision });
const published = publishStory({ publishRecord: approved, revision: 1, publisher: 'publisher-1' });
assert.equal(published.status, 'published');
assert.equal(published.revision, 1);

assert.throws(() => approveStory({ publishRecord: record, editor: 'editor-1', revision: 2 }), /current revision/);

const correction = createCorrection({ storyId: 'story-1', fromRevision: 1, toRevision: 2, reason: 'Corrected verified detail', editor: 'editor-1' });
assert.equal(correction.toRevision, 2);

console.log('publisher tests passed');
