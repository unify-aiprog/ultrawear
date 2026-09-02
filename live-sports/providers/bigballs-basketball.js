/**
 * Big Balls Sports Data basketball adapter.
 *
 * Optional free-tier source: credentials stay server-side and the canonical
 * event contract remains provider-neutral. The adapter is deliberately
 * limited to scores/statuses needed by the live feed.
 */

import { createSportEvent } from '../events.js';

const STATUS_MAP = Object.freeze({
  scheduled: 'scheduled',
  upcoming: 'scheduled',
  live: 'live',
  in_play: 'live',
  halftime: 'halftime',
  paused: 'halftime',
  finished: 'finished',
  final: 'finished',
  postponed: 'postponed',
  cancelled: 'cancelled',
});

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function team(value, fallback = 'TEAM') {
  if (typeof value === 'string') return { name: value };
  const id = value?.id ?? value?.team_id ?? value?.slug ?? null;
  const name = value?.name ?? value?.team_name ?? value?.short_name ?? (id ? String(id) : fallback);
  return { id: id != null ? String(id) : name, name };
}

function score(match) {
  const value = match?.scores?.value ?? match?.score ?? null;
  if (!value || (value.home == null && value.away == null)) return null;
  return { home: Number(value.home ?? 0), away: Number(value.away ?? 0) };
}

function status(match) {
  const value = clean(match?.status ?? match?.state).toLowerCase();
  return STATUS_MAP[value] ?? null;
}

export function normalizeBigBallsBasketball(payload, { observedAt = new Date().toISOString() } = {}) {
  const match = payload?.data ?? payload;
  if (!match?.id && !match?.match_id) throw new TypeError('Invalid Big Balls basketball match payload');
  const normalizedStatus = status(match);
  if (!normalizedStatus) throw new TypeError(`Unsupported Big Balls basketball status: ${match.status ?? match.state}`);

  const startsAt = match.starts_at ?? match.start_time ?? match.scheduled_at ?? match.date ?? null;
  if (!startsAt) throw new TypeError('Big Balls basketball match start time is required');

  return createSportEvent({
    id: `bigballs-basketball:${match.id ?? match.match_id}`,
    sport: 'basketball',
    competition: match.league ? {
      id: match.league.id != null ? String(match.league.id) : match.league.slug ?? match.league.name,
      name: match.league.name ?? match.league.slug ?? 'Basketball',
    } : null,
    home: team(match.home_team ?? match.home),
    away: team(match.away_team ?? match.away),
    startsAt: startsAt,
    status: normalizedStatus,
    score: score(match),
    venue: match.venue ?? null,
    source: 'bigballs-basketball',
    updatedAt: observedAt,
  });
}

export function createBigBallsBasketballAdapter({ baseUrl = 'https://api.bigballsdata.com', apiKey = null } = {}) {
  const token = clean(apiKey);
  return Object.freeze({
    id: 'bigballs-basketball',
    name: 'Big Balls Sports Data Basketball',
    sport: 'basketball',
    async fetch(fetchImpl = globalThis.fetch) {
      if (!token) throw new Error('BBS_API_KEY is not configured');
      if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation is required');
      const response = await fetchImpl(`${baseUrl}/v1/matches?sport=basketball&status=live`, {
        headers: { accept: 'application/json', authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Big Balls basketball request failed: ${response.status}`);
      const body = await response.json();
      return Array.isArray(body?.data) ? body.data : [];
    },
    normalize(payload, context = {}) {
      return normalizeBigBallsBasketball(payload, context);
    },
  });
}
