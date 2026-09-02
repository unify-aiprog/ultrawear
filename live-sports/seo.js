/** Provider-neutral SEO metadata and JSON-LD builders for canonical entities. */

const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char]));

export function buildMeta({ title, description, canonicalUrl = null, imageUrl = null, type = 'website' } = {}) {
  if (!title || !description) throw new TypeError('title and description are required');
  return {
    title: String(title),
    description: String(description),
    canonicalUrl: canonicalUrl ? String(canonicalUrl) : null,
    imageUrl: imageUrl ? String(imageUrl) : null,
    type: String(type),
  };
}

export function eventJsonLd(event, { url = null } = {}) {
  if (!event?.id || !event?.startsAt) throw new TypeError('event id and startsAt are required');
  const home = event.home?.name || event.home?.shortName || null;
  const away = event.away?.name || event.away?.shortName || null;
  const name = home && away ? `${home} vs ${away}` : event.name || 'Sports event';
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    sport: event.sport || undefined,
    startDate: event.startsAt,
    eventStatus: event.status || undefined,
    location: event.venue?.name ? { '@type': 'Place', name: event.venue.name } : undefined,
    homeTeam: home ? { '@type': 'SportsTeam', name: home } : undefined,
    awayTeam: away ? { '@type': 'SportsTeam', name: away } : undefined,
    url: url || undefined,
  };
}

export function personJsonLd(person, { url = null } = {}) {
  if (!person?.id || !person?.name) throw new TypeError('person id and name are required');
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    image: person.image || undefined,
    nationality: person.nationality || undefined,
    url: url || undefined,
    jobTitle: Array.isArray(person.roles) && person.roles.length ? person.roles.join(', ') : undefined,
  };
}

export function jsonLdScript(data) {
  return `<script type="application/ld+json">${esc(JSON.stringify(data))}</script>`;
}
