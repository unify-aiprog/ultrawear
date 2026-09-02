/**
 * football-data.org v4 adapter.
 *
 * Free-tier coverage is intentionally treated as a delayed football source,
 * not a live-score authority. Credentials stay server-side.
 */

import { createSportEvent } from '../events.js';

const STATUS_MAP = Object.freeze({
  SCHEDULED: 'scheduled',
  TIMED: 'scheduled',
  LIVE: 'live',
  IN_PLAY: 'live',
  PAUSED: 'halftime',
  FINISHED: 'finished',
  POSTPONED: 'postponed',
  SUSPENDED: 'postponed',
  CANCELLED: 'cancelled',
});

function team(value) {
  if (!value?.id && !value?.name) throw new TypeError('Missing football-data team');
  return { id: value.id != null ? String(value.id) : value.name, name: value.name ?? String(value.id) };
}

function score(match) {
  const full = match?.score?.fullTime;
  if (!full || (full.home == null && full.away == null)) return null;
  return { home: full.home ?? 0, away: full.away ?? 0 };
}

export function createFootballDataAdapter({ baseUrl = 'https://api.football-data.org/v4', token = null } = {}) {
  return Object.freeze({
    id: 'football-data',
    sport: 'football',
    capabilities: ['fixtures', 'scores', 'standings', 'teams', 'players'],
    async fetch(path, fetchImpl = globalThis.fetch) {
      if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation is required');
      const headers = token ? { 'X-Auth-Token': token } : {};
      const response = await fetchImpl(`${baseUrl}${path}`, { headers });
      if (!response.ok) throw new Error(`football-data request failed: ${response.status}`);
      return response.json();
    },
    normalize(payload, { observedAt = new Date().toISOString() } = {}) {
      const match = payload?.match ?? payload;
      if (!match?.id || !match?.utcDate || !match?.competition || !match?.homeTeam || !match?.awayTeam) {
        throw new TypeError('Invalid football-data match payload');
      }
      const status = STATUS_MAP[match.status];
      if (!status) throw new TypeError(`Unsupported football-data status: ${match.status}`);
      return createSportEvent({
        id: `football-data:${match.id}`,
        sport: 'football',
        competition: {
          id: match.competition.id != null ? String(match.competition.id) : match.competition.code,
          name: match.competition.name,
          code: match.competition.code,
        },
        home: team(match.homeTeam),
        away: team(match.awayTeam),
        startsAt: match.utcDate,
        status,
        score: score(match),
        venue: match.venue ?? null,
        source: 'football-data',
        updatedAt: observedAt,
      });
    },
  });
}
