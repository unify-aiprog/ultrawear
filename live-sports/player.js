/**
 * Sport-neutral player/athlete role record.
 *
 * Person is the identity layer; this record contains player-specific career
 * information so one person can later have player, manager, coach, or other roles.
 */

function clean(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

export function createPlayer({
  personId,
  sportIds = [],
  teamIds = [],
  position = null,
  jerseyNumber = null,
  careerStart = null,
  careerEnd = null,
  active = true,
  stats = {},
  achievements = [],
  updatedAt = null,
}) {
  const normalizedPersonId = clean(personId);
  if (!normalizedPersonId) throw new TypeError('Player personId is required');

  return Object.freeze({
    personId: normalizedPersonId,
    type: 'player',
    sportIds: uniqueStrings(sportIds),
    teamIds: uniqueStrings(teamIds),
    position: clean(position) || null,
    jerseyNumber: jerseyNumber ?? null,
    careerStart: clean(careerStart) || null,
    careerEnd: clean(careerEnd) || null,
    active: active !== false,
    stats: stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : {},
    achievements: Array.isArray(achievements) ? achievements : [],
    updatedAt: updatedAt || null,
  });
}
