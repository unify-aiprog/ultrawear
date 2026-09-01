/** Provider-neutral live sports event contracts. */

export const EVENT_STATUSES = Object.freeze(['scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled']);

export function createSportEvent({ id, sport, competition, home, away, startsAt, status = 'scheduled', score = null, venue = null, source = null, updatedAt = null }) {
  if (!id || !sport || !competition || !home || !away || !startsAt || !EVENT_STATUSES.includes(status)) throw new TypeError('Invalid live sport event');
  return { id, sport, competition, home: { ...home }, away: { ...away }, startsAt, status, score: score ? { ...score } : null, venue, source, updatedAt };
}

export function updateEvent(event, patch) {
  if (!event || !event.id) throw new TypeError('Event is required');
  if (patch.status && !EVENT_STATUSES.includes(patch.status)) throw new TypeError('Invalid event status');
  return { ...event, ...patch, home: patch.home ? { ...patch.home } : event.home, away: patch.away ? { ...patch.away } : event.away, score: patch.score ? { ...patch.score } : event.score, updatedAt: patch.updatedAt || new Date().toISOString() };
}
