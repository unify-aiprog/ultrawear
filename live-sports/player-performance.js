/** Provider-neutral player performance contract. */

function clean(value) {
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizePlayerPerformance(performance) {
  if (!performance || typeof performance !== 'object') {
    throw new TypeError('Player performance is required');
  }
  const personId = clean(performance.personId);
  if (!personId) throw new TypeError('Player performance personId is required');

  return Object.freeze({
    personId,
    teamId: clean(performance.teamId) || null,
    opponentId: clean(performance.opponentId) || null,
    role: clean(performance.role) || null,
    started: performance.started === true,
    minutes: Number.isFinite(performance.minutes) ? performance.minutes : null,
    stats: performance.stats && typeof performance.stats === 'object' && !Array.isArray(performance.stats)
      ? { ...performance.stats }
      : {},
  });
}

export function normalizePlayerPerformances(performances = []) {
  if (!Array.isArray(performances)) return [];
  return performances.map(normalizePlayerPerformance);
}
