/**
 * SportRadar Soccer adapter.
 *
 * This module only normalizes provider payloads. It never calls the provider and
 * never fabricates missing values. Production credentials/network access belong
 * in a server-side source worker, not in the browser.
 */
import { createSportEvent, createSportMoment } from '../events.js';
import { createSourceAdapter } from '../adapter.js';

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
  own_goal: 'own_goal',
  penalty_awarded: 'penalty_awarded',
  penalty_goal: 'penalty_goal',
  penalty_miss: 'penalty_miss',
  red_card: 'red_card',
  yellow_card: 'yellow_card',
  second_yellow: 'second_yellow',
  substitution: 'substitution',
  var: 'var',
  no_goal: 'var',
  no_penalty: 'var',
  injury: 'injury',
  kickoff: 'kickoff',
  halftime: 'halftime',
  full_time: 'fulltime',
  fulltime: 'fulltime',
  extra_time: 'extra_time',
  shootout: 'shootout',
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

function timelineMoment(item, index, { home, away }) {
  const rawType = String(item?.description ?? item?.type ?? '').trim().toLowerCase();
  const type = MOMENT_MAP[rawType];
  if (!type) return null;

  // The canonical moment contract requires an actual occurrence timestamp.
  // Match-clock strings are retained as `minute`, but are never promoted to
  // timestamps because doing so would fabricate wall-clock time.
  const occurredAt = item?.timestamp ?? item?.occurred_at ?? item?.occurredAt;
  if (!occurredAt) return null;

  const side = item?.competitor === 'home' ? home : item?.competitor === 'away' ? away : null;
  const actor = item?.player?.id ?? item?.player?.name ?? item?.competitor_player_id ?? null;
  const team = side?.id ?? item?.team?.id ?? item?.team?.name ?? null;

  return createSportMoment({
    id: item?.id ?? `sportradar-moment:${type}:${occurredAt}:${index}`,
    type,
    occurredAt,
    minute: item?.minute ?? item?.match_time ?? item?.match_clock ?? item?.clock ?? null,
    title: item?.description ?? rawType,
    description: item?.comment ?? item?.text ?? null,
    actor,
    team,
    related: item?.related_to ? [item.related_to] : [],
    animation: { key: type.replace(/_/g, '-'), replayable: true },
    // Provider observation is not cross-source verification. Reconciliation
    // decides whether the canonical moment becomes corroborated/verified.
    verified: false,
    source: { id: 'sportradar-soccer', provider: 'Sportradar' },
  });
}

function normalizeMoments(payload, teams) {
  const timeline = Array.isArray(payload?.timeline) ? payload.timeline : [];
  return timeline.map((item, index) => timelineMoment(item, index, teams)).filter(Boolean);
}

export function normalizeSportRadarSoccer(payload, context = {}) {
  const event = payload?.sport_event ?? {};
  const status = normalizeStatus(payload);
  const teams = competitors(payload);
  const startsAt = required(event.start_time, 'sport_event.start_time');
  const score = payload?.sport_event_status ? {
    home: payload.sport_event_status.home_score ?? null,
    away: payload.sport_event_status.away_score ?? null,
  } : null;
  const moments = normalizeMoments(payload, teams);
  const latestMoment = moments.reduce((latest, current) => (
    !latest || current.occurredAt > latest.occurredAt ? current : latest
  ), null);

  return createSportEvent({
    id: required(event.id, 'sport_event.id'),
    sport: 'football',
    competition: { id: event.sport_event_context?.competition?.id ?? null, name: event.sport_event_context?.competition?.name ?? event.sport_event_context?.category?.name ?? 'Football' },
    home: { id: required(teams.home.id, 'home.id'), name: required(teams.home.name, 'home.name'), shortName: teams.home.abbreviation ?? teams.home.short_name ?? null },
    away: { id: required(teams.away.id, 'away.id'), name: required(teams.away.name, 'away.name'), shortName: teams.away.abbreviation ?? teams.away.short_name ?? null },
    startsAt,
    status: required(status, `sport_event_status.status (${payload?.sport_event_status?.status ?? 'unknown'})`),
    score,
    venue: event.venue ? { id: event.venue.id ?? null, name: event.venue.name ?? null, city: event.venue.city_name ?? null } : null,
    source: { id: 'sportradar-soccer', provider: 'Sportradar', observedAt: context.observedAt ?? new Date().toISOString() },
    moment: latestMoment,
    moments,
    updatedAt: payload?.sport_event_status?.updated_at ?? context.observedAt ?? null,
  });
}

export const sportradarSoccerAdapter = createSourceAdapter({
  id: 'sportradar-soccer',
  name: 'Sportradar Soccer',
  sport: 'football',
  normalize: normalizeSportRadarSoccer,
});
