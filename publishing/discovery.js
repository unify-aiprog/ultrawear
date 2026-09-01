/** Build deterministic metadata without inventing editorial facts. */

export function createSeoMetadata(article, { siteName = 'UltraWear FC' } = {}) {
  if (!article?.canonicalUrl || !article.title) throw new TypeError('Article canonicalUrl and title are required');
  return {
    title: article.title,
    description: article.description || article.title,
    canonical: article.canonicalUrl,
    og: {
      type: article.type === 'NewsArticle' ? 'article' : 'website',
      title: article.title,
      description: article.description || article.title,
      url: article.canonicalUrl,
      image: article.image || null,
      siteName,
    },
  };
}

export function createArticleStructuredData(article, { publisherUrl = null } = {}) {
  if (!article?.canonicalUrl || !article.title) throw new TypeError('Article canonicalUrl and title are required');

  const data = {
    '@context': 'https://schema.org',
    '@type': article.type === 'NewsArticle' ? 'NewsArticle' : 'Article',
    headline: article.title,
    url: article.canonicalUrl,
  };

  if (article.description) data.description = article.description;
  if (article.image) data.image = article.image;
  if (article.publishedAt) data.datePublished = article.publishedAt;
  if (article.updatedAt) data.dateModified = article.updatedAt;
  if (article.author?.name) data.author = { '@type': 'Person', name: article.author.name };
  if (article.publisher?.name) {
    data.publisher = { '@type': 'Organization', name: article.publisher.name };
    if (publisherUrl) data.publisher.url = publisherUrl;
  }

  return data;
}

export function selectRelatedContent(article, candidates, limit = 5) {
  if (!article?.id || !Array.isArray(candidates)) return [];
  return candidates
    .filter((candidate) => candidate?.id && candidate.id !== article.id && candidate.canonicalUrl)
    .map((candidate) => ({
      candidate,
      score: overlap(article.entities, candidate.entities) * 2 + overlap(article.topics, candidate.topics),
    }))
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title))
    .slice(0, Math.max(0, limit))
    .map(({ candidate }) => candidate);
}

function overlap(left = [], right = []) {
  const rightSet = new Set(right);
  return [...new Set(left)].filter((value) => rightSet.has(value)).length;
}
