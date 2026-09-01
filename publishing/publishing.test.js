import assert from 'node:assert/strict';
import { createCanonicalArticle } from './article-contract.js';
import { createArticleStructuredData, createSeoMetadata, selectRelatedContent } from './discovery.js';
import { createHub, createHubUrl } from './entities.js';
import { buildSitemapEntries, serializeSitemap } from './sitemap.js';

const story = {
  id: 'story-1',
  type: 'match_report',
  canonicalSlug: 'example-match',
  state: 'approved',
  entities: ['team-a', 'player-a'],
  publishedAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};
const revision = { revision: 2, title: 'Example Match', body: 'Verified match report.' };
const article = createCanonicalArticle({
  story,
  revision,
  siteUrl: 'https://example.com/',
  description: 'A verified match report.',
  author: { name: 'Editor' },
});

assert.equal(article.canonicalUrl, 'https://example.com/news/example-match');
assert.equal(createSeoMetadata(article).canonical, article.canonicalUrl);
assert.equal(createArticleStructuredData(article).headline, revision.title);
assert.equal(createArticleStructuredData(article).author.name, 'Editor');

const related = selectRelatedContent(article, [
  article,
  { id: 'story-2', title: 'Player', canonicalUrl: '/player', entities: ['player-a'], topics: [] },
  { id: 'story-3', title: 'Unrelated', canonicalUrl: '/other', entities: [], topics: [] },
]);
assert.deepEqual(related.map((item) => item.id), ['story-2', 'story-3']);

const hub = createHub({ id: 'team-a', type: 'entity', slug: 'team-a', name: 'Team A' });
assert.equal(createHubUrl('https://example.com', hub), 'https://example.com/entities/team-a');

const sitemap = serializeSitemap(['https://example.com/z', 'https://example.com/a', 'https://example.com/a']);
assert.deepEqual(buildSitemapEntries(['b', 'a', 'b']), [{ loc: 'a' }, { loc: 'b' }]);
assert.match(sitemap, /<loc>https:\/\/example.com\/a<\/loc>/);
assert.equal((sitemap.match(/<loc>/g) || []).length, 2);

console.log('publishing tests passed');
