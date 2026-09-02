/**
 * Vendor-neutral source catalog for the UltraWear Sports Data Engine.
 *
 * Providers are inputs, never the product contract. A source can be open,
 * self-hosted, or commercial and must expose the same canonical capabilities.
 */

export const SOURCE_TYPES = Object.freeze(['open', 'self_hosted', 'commercial', 'manual']);
export const SOURCE_CAPABILITIES = Object.freeze([
  'fixtures',
  'results',
  'live_scores',
  'events',
  'lineups',
  'player_stats',
  'team_stats',
  'standings',
  'rankings',
  'history',
]);

export function createSourceDefinition({
  id,
  name,
  type = 'open',
  sports = [],
  capabilities = [],
  priority = 100,
  enabled = true,
}) {
  if (!id || !name || !SOURCE_TYPES.includes(type)) throw new TypeError('Invalid source definition');
  const normalizedCapabilities = capabilities.filter((item) => SOURCE_CAPABILITIES.includes(item));
  return Object.freeze({
    id,
    name,
    type,
    sports: [...sports],
    capabilities: [...new Set(normalizedCapabilities)],
    priority: Number.isFinite(priority) ? priority : 100,
    enabled: Boolean(enabled),
  });
}

export function createSourceCatalog(definitions = []) {
  const sources = new Map();
  definitions.forEach((definition) => {
    const source = definition?.id ? definition : createSourceDefinition(definition);
    if (sources.has(source.id)) throw new Error(`Source already registered: ${source.id}`);
    sources.set(source.id, source);
  });

  return Object.freeze({
    get(id) {
      return sources.get(id) ?? null;
    },
    list({ sport = null, capability = null, enabledOnly = true } = {}) {
      return [...sources.values()]
        .filter((source) => !enabledOnly || source.enabled)
        .filter((source) => !sport || source.sports.includes(sport))
        .filter((source) => !capability || source.capabilities.includes(capability))
        .sort((a, b) => a.priority - b.priority);
    },
  });
}

export const defaultSourceCatalog = createSourceCatalog([
  createSourceDefinition({
    id: 'football-data-org',
    name: 'football-data.org',
    type: 'open',
    sports: ['Football'],
    capabilities: ['fixtures', 'results', 'standings', 'history'],
    priority: 10,
  }),
  createSourceDefinition({
    id: 'thesportsdb',
    name: 'TheSportsDB',
    type: 'open',
    sports: ['Football', 'Basketball', 'Tennis', 'Motorsport', 'Golf', 'Boxing'],
    capabilities: ['fixtures', 'results', 'events', 'player_stats', 'team_stats', 'standings'],
    priority: 20,
  }),
  createSourceDefinition({
    id: 'openligadb',
    name: 'OpenLigaDB',
    type: 'open',
    sports: ['Football'],
    capabilities: ['fixtures', 'results', 'live_scores', 'standings'],
    priority: 30,
  }),
  createSourceDefinition({
    id: 'sportradar',
    name: 'Sportradar',
    type: 'commercial',
    sports: ['Football'],
    capabilities: ['fixtures', 'results', 'live_scores', 'events', 'lineups', 'player_stats', 'team_stats', 'standings', 'history'],
    priority: 100,
  }),
]);
