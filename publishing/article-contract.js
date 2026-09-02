/**
 * Provider-neutral publishing contract.
 * This is the handoff between approved Content Core stories and a future CMS.
 */

const ARTICLE_TYPES = new Set([
  'Article',
  'NewsArticle',
  'BlogPosting',
]);

export function createCanonicalArticle({
  story,
  revision,
  siteUrl,
  author = null,
  publisher = null,
  description = '',
  image = null,
  topics = [],
}) {
  if (!story || !revision || !siteUrl) throw new TypeError('Story, revision and siteUrl are required');
  if (!Number.isInteger(revision.revision) || revision.revision < 1) throw new TypeError('Invalid revision');
  if (!['approved', 'published'].includes(story.state)) {
    throw new Error('Only approved or published stories can become canonical articles');
  }

  const base = siteUrl.replace(/\/+$/, '');
  const canonicalUrl = `${base}/news/${encodeURIComponent(story.canonicalSlug)}`;

  return Object.freeze({
    id: story.id,
    canonicalUrl,
    type: story.type,
    title: revision.title,
    body: revision.body,
    description,
    image,
    author,
    publisher,
    topics: [...topics],
    entities: [...story.entities],
    revision: revision.revision,
    publishedAt: story.publishedAt,
    updatedAt: story.updatedAt,
  });
}

export function validateArticleType(type) {
  return ARTICLE_TYPES.has(type);
}
