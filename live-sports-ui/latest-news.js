const LATEST_NEWS = Object.freeze([
  { slug: 'the-game-is-bigger-than-the-score', category: 'Culture', title: 'The game is bigger than the score.', dek: 'Sport is competition, but it is also memory, identity, ritual and community.', image: '/assets/news-community.svg' },
  { slug: 'built-by-fans-made-for-everyone', category: 'People', title: 'Built by fans. Made for everyone.', dek: 'A sports platform should help more people find their way into the world of sport.', image: '/assets/news-matchday.svg' },
  { slug: 'why-global-sport-needs-better-discovery', category: 'Platform', title: 'Why global sport needs better discovery.', dek: 'The world of sport is enormous. Its digital front doors should reflect that.', image: '/assets/news-sport-world.svg' },
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderLatestNews(container, { compact = false } = {}) {
  if (!container) return;
  const items = compact ? LATEST_NEWS.slice(0, 1) : LATEST_NEWS;
  container.innerHTML = `<section class="live-news-fallback" aria-labelledby="latest-live-news-title">
    <div class="live-news-fallback__heading"><span>THE FEED</span><h3 id="latest-live-news-title">LATEST NEWS.</h3><a href="/news">View all ↗</a></div>
    <div class="live-news-fallback__grid">${items.map((article) => `<a class="live-news-fallback__card" href="/news/${encodeURIComponent(article.slug)}"><div class="live-news-fallback__image" style="background-image:url('${article.image}')" aria-hidden="true"></div><span>${escapeHtml(article.category)}</span><b>${escapeHtml(article.title)}</b><small>${escapeHtml(article.dek)}</small></a>`).join('')}</div>
  </section>`;
}
