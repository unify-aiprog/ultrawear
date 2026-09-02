const PUBLISH_STATUSES = Object.freeze(['draft', 'approved', 'published', 'unpublished']);

export function createRevision({ storyId, revision, title, body, editor = null, reason = 'edit' }) {
  if (!storyId || !Number.isInteger(revision) || revision < 1 || !title || !body) {
    throw new TypeError('Invalid story revision');
  }
  return Object.freeze({
    storyId,
    revision,
    title,
    body,
    editor,
    reason,
    createdAt: new Date().toISOString(),
  });
}

export function createPublishRecord({ storyId, canonicalUrl, revision, status = 'draft', publishedAt = null }) {
  if (!storyId || !canonicalUrl || !Number.isInteger(revision)) throw new TypeError('Invalid publish record');
  if (!PUBLISH_STATUSES.includes(status)) throw new TypeError('Invalid publish status');
  return {
    storyId,
    canonicalUrl,
    revision,
    status,
    publishedAt,
    updatedAt: new Date().toISOString(),
  };
}

export function approveStory({ publishRecord, editor, revision }) {
  if (!editor || !publishRecord || revision !== publishRecord.revision) {
    throw new Error('Editor approval requires the current revision');
  }
  return { ...publishRecord, status: 'approved', approvedBy: editor, approvedAt: new Date().toISOString() };
}

export function publishStory({ publishRecord, revision, publisher }) {
  if (!publisher || publishRecord.status !== 'approved' || revision !== publishRecord.revision) {
    throw new Error('Only the approved current revision can be published');
  }
  return { ...publishRecord, status: 'published', publishedAt: new Date().toISOString(), publishedBy: publisher };
}

export function createCorrection({ storyId, fromRevision, toRevision, reason, editor }) {
  if (!storyId || !Number.isInteger(fromRevision) || !Number.isInteger(toRevision) || !reason || !editor) {
    throw new TypeError('Invalid correction record');
  }
  return Object.freeze({
    storyId,
    fromRevision,
    toRevision,
    reason,
    editor,
    createdAt: new Date().toISOString(),
  });
}

export function toArticleDocument({ story, revision, metadata = {} }) {
  if (!story || !revision) throw new TypeError('Story and revision are required');
  return {
    id: story.id,
    canonicalSlug: story.canonicalSlug,
    type: story.type,
    title: revision.title,
    body: revision.body,
    revision: revision.revision,
    metadata: { ...metadata },
    publishedAt: story.publishedAt,
  };
}
