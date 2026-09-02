/** Server-side live-source factory for Sportradar soccer. */

import { createSportradarSoccerClient } from './sportradar-soccer-client.js';
import { normalizeSportRadarSoccer } from './sportradar-soccer.js';

function items(payload) {
  if (Array.isArray(payload?.summaries)) return payload.summaries;
  if (Array.isArray(payload?.sport_events)) return payload.sport_events;
  return [];
}

export function createSportradarSoccerLiveSource(env) {
  const client = createSportradarSoccerClient(env);
  return Object.freeze({
    id: 'sportradar-soccer',
    name: 'Sportradar Soccer',
    sport: 'football',
    async fetch() {
      return items(await client.liveSummaries());
    },
    normalize(payload, context = {}) {
      return normalizeSportRadarSoccer(payload, context);
    },
  });
}
