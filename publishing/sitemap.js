export function buildSitemapEntries(urls = []) {
  return [...new Set(urls.filter(Boolean))].sort().map((loc) => ({ loc }));
}

export function serializeSitemap(urls = []) {
  const entries = buildSitemapEntries(urls);
  const body = entries.map(({ loc }) => `  <url><loc>${escapeXml(loc)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
