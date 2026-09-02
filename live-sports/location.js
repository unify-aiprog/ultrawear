/** Coarse location relevance: global, Africa, country, and optional region. */

export const LOCATION_LAYERS = Object.freeze(['global', 'africa', 'country', 'region']);

export function rankLocationLayers(items, { country = null, region = null } = {}) {
  return [...items].sort((a, b) => score(b) - score(a));

  function score(item) {
    const location = item.location || {};
    let value = Number(item.relevance || 0);
    if (location.layer === 'global') value += 1;
    if (location.layer === 'africa') value += 2;
    if (country && location.country === country) value += 4;
    if (region && location.region === region) value += 5;
    return value;
  }
}
