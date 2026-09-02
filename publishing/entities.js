const HUB_TYPES = new Set(['entity', 'topic', 'event']);

export function createHub({ id, type, slug, name, description = '', relatedIds = [] }) {
  if (!id || !HUB_TYPES.has(type) || !slug || !name) throw new TypeError('Invalid hub');
  return Object.freeze({
    id,
    type,
    slug,
    name,
    description,
    relatedIds: [...new Set(relatedIds)],
  });
}

export function createHubUrl(siteUrl, hub) {
  if (!siteUrl || !hub?.slug) throw new TypeError('Site URL and hub are required');
  const base = siteUrl.replace(/\/+$/, '');
  return `${base}/${hub.type}s/${encodeURIComponent(hub.slug)}`;
}

export function attachHubLinks(article, hubs = []) {
  const ids = new Set(article?.entities || []);
  return hubs.filter((hub) => ids.has(hub.id)).map((hub) => ({
    id: hub.id,
    name: hub.name,
    url: hub.url,
  }));
}
