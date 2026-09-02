/** Provider-neutral live sports event contracts. */

export const EVENT_STATUSES = Object.freeze(['scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled']);

export const MOMENT_TYPES = Object.freeze([
  'goal', 'own_goal', 'penalty_goal', 'penalty_miss', 'penalty_awarded', 'substitution',
  'yellow_card', 'red_card', 'second_yellow', 'var', 'injury', 'kickoff', 'halftime',
  'fulltime', 'extra_time', 'shootout', 'transfer', 'manager_sacked', 'manager_appointed',
  'retirement', 'milestone', 'award', 'record', 'disqualification', 'result', 'other',
]);

function copyMoment(moment) {
  if (moment == null) return null;
  if (typeof moment !== 'object' || !moment.type || !MOMENT_TYPES.includes(moment.type)) throw new TypeError('Invalid live sport moment');
  return { ...moment, animation: moment.animation ? { ...moment.animation } : null };
}

function copyMoments(moments) {
  if (moments == null) return [];
  if (!Array.isArray(moments)) throw new TypeError('Invalid event moments');
  return moments.map(copyMoment).filter(Boolean);
}

function copyPerformances(performances) {
  if (performances == null) return [];
  if (!Array.isArray(performances)) throw new TypeError('Invalid player performances');
  return performances.map((performance) => ({
    ...performance,
    stats: performance?.stats && typeof performance.stats === 'object' ? { ...performance.stats } : {},
  }));
}

export function createSportEvent({ id, sport, competition, home, away, startsAt, status = 'scheduled', score = null, venue = null, source = null, moment = null, moments = [], stats = [], performances = [], updatedAt = null }) {
  if (!id || !sport || !competition || !home || !away || !startsAt || !EVENT_STATUSES.includes(status)) throw new TypeError('Invalid live sport event');
  return { id, sport, competition, home: { ...home }, away: { ...away }, startsAt, status, score: score ? { ...score } : null, venue, source, moment: copyMoment(moment), moments: copyMoments(moments), stats: Array.isArray(stats) ? stats.map((item) => ({ ...item })) : [], performances: copyPerformances(performances), updatedAt };
}

export function updateEvent(event, patch) {
  if (!event || !event.id) throw new TypeError('Event is required');
  if (patch.status && !EVENT_STATUSES.includes(patch.status)) throw new TypeError('Invalid event status');
  return { ...event, ...patch, home: patch.home ? { ...patch.home } : event.home, away: patch.away ? { ...patch.away } : event.away, score: patch.score ? { ...patch.score } : event.score, moment: patch.moment === undefined ? event.moment ?? null : copyMoment(patch.moment), moments: patch.moments === undefined ? event.moments ?? [] : copyMoments(patch.moments), stats: patch.stats === undefined ? event.stats ?? [] : Array.isArray(patch.stats) ? patch.stats.map((item) => ({ ...item })) : [], performances: patch.performances === undefined ? event.performances ?? [] : copyPerformances(patch.performances), updatedAt: patch.updatedAt || new Date().toISOString() };
}

export function createSportMoment({ type, occurredAt, minute = null, title = null, description = null, actor = null, team = null, related = [], animation = null, verified = false, source = null, id = null }) {
  if (!type || !MOMENT_TYPES.includes(type) || !occurredAt) throw new TypeError('Invalid sport moment');
  return {
    id: id ?? `moment:${type}:${occurredAt}`,
    type,
    occurredAt,
    minute,
    title,
    description,
    actor,
    team,
    related: Array.isArray(related) ? [...related] : [],
    animation: animation ? { ...animation } : null,
    verified: Boolean(verified),
    source,
  };
}
