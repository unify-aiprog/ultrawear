/** Provider-neutral live sports event contracts. */

export const EVENT_STATUSES = Object.freeze(['scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled']);

function copyMoment(moment) {
  if (moment == null) return null;
  if (typeof moment !== 'object' || !moment.type) throw new TypeError('Invalid live sport moment');
  return { ...moment };
}

export function createSportEvent({ id, sport, competition, home, away, startsAt, status = 'scheduled', score = null, venue = null, source = null, moment = null, updatedAt = null }) {
  if (!id || !sport || !competition || !home || !away || !startsAt || !EVENT_STATUSES.includes(status)) throw new TypeError('Invalid live sport event');
  return { id, sport, competition, home: { ...home }, away: { ...away }, startsAt, status, score: score ? { ...score } : null, venue, source, moment: copyMoment(moment), updatedAt };
}

export function updateEvent(event, patch) {
  if (!event || !event.id) throw new TypeError('Event is required');
  if (patch.status && !EVENT_STATUSES.includes(patch.status)) throw new TypeError('Invalid event status');
  return { ...event, ...patch, home: patch.home ? { ...patch.home } : event.home, away: patch.away ? { ...patch.away } : event.away, score: patch.score ? { ...patch.score } : event.score, moment: patch.moment === undefined ? event.moment ?? null : copyMoment(patch.moment), updatedAt: patch.updatedAt || new Date().toISOString() };
}
