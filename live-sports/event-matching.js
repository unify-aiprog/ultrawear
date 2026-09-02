/** Provider-neutral event identity matching. */

function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(fc|afc|cf|sc|club)\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function minutesBetween(a, b) {
  const left = Date.parse(a);
  const right = Date.parse(b);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return Infinity;
  return Math.abs(left - right) / 60000;
}

export function eventMatchScore(left, right, { kickoffWindowMinutes = 180 } = {}) {
  if (!left?.startsAt || !right?.startsAt) return 0;
  const kickoffDistance = minutesBetween(left.startsAt, right.startsAt);
  if (kickoffDistance > kickoffWindowMinutes) return 0;

  const teams = [
    [normalizeName(left.home?.name), normalizeName(right.home?.name)],
    [normalizeName(left.away?.name), normalizeName(right.away?.name)],
  ];
  const teamMatches = teams.filter(([a, b]) => a && b && a === b).length;
  if (teamMatches === 2) return 0.98;
  if (teamMatches === 1) return 0.55;
  return 0;
}

export function findBestEventMatch(event, candidates = [], options = {}) {
  return candidates
    .map((candidate) => ({ candidate, score: eventMatchScore(event, candidate, options) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0] ?? null;
}
