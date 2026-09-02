/**
 * SportRadar Soccer adapter.
 *
 * This module only normalizes provider payloads. It never calls the provider and
 * never fabricates missing values. Production credentials/network access belong
 * in a server-side source worker, not in the browser.
 */
import { createSportEvent } from '../events.js';
import { createSourceAdapter } from '../adapter.js';
import { normalizeMoment } from '../../live-sports-ui/moments.js';

const STATUS_MAP = Object.freeze({
  not_started: 'scheduled',
  live: 'live',
  halftime: 'halftime',
  ended: 'finished',
  closed: 'finished',
  postponed: 'postponed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
});

const MOMENT_MAP = Object.freeze({
  goal: 'goal',
  penalty: 'penalty',
  red_card: 'red_card',
  var: 'var',
  no_goal: 'var',
  no_penalty: 'var',
});

function required(value, label) {
  if (value == null || value === '') throw new TypeError(`Missing SportRadar field: ${label}`);
  return value;
}

function competitors(payload) {
  const list = payload?.sport_event?.competitors ?? payload?.sport_event_context?.competitors ?? [];
  const home = list.find((item) => item.qualifier === 'home');
  const away = list.find((item) => item.qualifier === 'away');
  if (!home || !away) throw new TypeError('SportRadar payload must contain home and away competitors');
  return { home, away };
}

function normalizeStatus(payload) {
  const raw = payload?.sport_event_status?.status ?? payload?.sport_event_status?.match_status ?? 'not_started';
  return STATUS_MAP[raw] ?? null;
}

function normalizeMomentFromTimeline(payload) {
  const timeline = payload?.timeline ?? [];
  const latest = [...timeline].reverse().find((item) => MOMENT_MAP[item.description] || MOMENT_MAP[item.type]);
  if (!latest) return null;
  const type = MOMENT_MAP[latest.description] ?? MOMENT_MAP[latest.type];
  return normalizeMoment({
    type,
    sport: 'Football',
    team: latest.competitor ?? null,
    timestamp: latest.match_clock ?? null,
    verified: true,
  });
}

export function normalizeSportRadarSoccer(payload, context = {}) {
  const event = payload?.sport_event ?? {};
  const status = normalizeStatus(payload);
  const { home, away } = competitors(payload);
  const startsAt = required(event.start_time, 'sport_event.start_time');
  const score = payload?.sport_event_status ? {
    home: payload.sport_event_status.home_score ?? null,
    away: payload.sport_event_status.away_score ?? null,
  } : null;

  return createSportEvent({
    id: required(event.id, 'sport_event.id'),
    sport: 'Football',
    competition: event.sport_event_context?.competition?.name ?? event.sport_event_context?.category?.name ?? 'Football',
    home: { id: required(home.id, 'home.id'), name: required(home.name, 'home.name'), shortName: home.abbreviation ?? home.short_name ?? null },
    away: { id: required(away.id, 'away.id'), name: required(away.name, 'away.name'), shortName: away.abbreviation ?? away.short_name ?? null },
    startsAt,
    status: required(status, `sport_event_status.status (${payload?.sport_event_status?.status ?? 'unknown'})`),
    score,
    venue: event.venue ? { id: event.venue.id ?? null, name: event.venue.name ?? null, city: event.venue.city_name ?? null } : null,
    source: { id: 'sportradar-soccer', provider: 'Sportradar', observedAt: context.observedAt ?? new Date().toISOString() },
    moment: normalizeMomentFromTimeline(payload),
    updatedAt: payload?.sport_event_status?.updated_at ?? context.observedAt ?? null,
  });
}

export const sportradarSoccerAdapter = createSourceAdapter({
  id: 'sportradar-soccer',
  name: 'Sportradar Soccer',
  sport: 'Football',
  normalize: normalizeSportRadarSoccer,
});
