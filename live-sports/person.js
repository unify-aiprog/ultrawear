/**
 * Sport-neutral person entity.
 *
 * A person can hold multiple sports roles over time, for example:
 * player -> manager. Role-specific records should be linked by personId
 * rather than creating disconnected people for each career phase.
 */

export const PERSON_ROLES = Object.freeze([
  'player',
  'athlete',
  'manager',
  'coach',
  'official',
]);

function clean(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeRole(role) {
  const normalized = clean(role)?.toLowerCase();
  if (!PERSON_ROLES.includes(normalized)) {
    throw new TypeError(`Unsupported person role: ${role}`);
  }
  return normalized;
}

function normalizeRoles(roles = []) {
  if (!Array.isArray(roles)) throw new TypeError('roles must be an array');
  return [...new Set(roles.map(normalizeRole))];
}

export function createPerson({
  id,
  name,
  shortName = null,
  nationality = null,
  roles = [],
  sportIds = [],
  currentTeamId = null,
  image = null,
  source = null,
  updatedAt = null,
}) {
  const normalizedId = clean(id);
  const normalizedName = clean(name);
  if (!normalizedId) throw new TypeError('Person id is required');
  if (!normalizedName) throw new TypeError('Person name is required');

  const normalizedRoles = normalizeRoles(roles);
  const normalizedSportIds = [...new Set(
    (Array.isArray(sportIds) ? sportIds : []).map(clean).filter(Boolean),
  )];

  return Object.freeze({
    id: normalizedId,
    type: 'person',
    name: normalizedName,
    shortName: clean(shortName) || null,
    nationality: clean(nationality) || null,
    roles: normalizedRoles,
    sportIds: normalizedSportIds,
    currentTeamId: clean(currentTeamId) || null,
    image: image || null,
    source: source || null,
    updatedAt: updatedAt || null,
  });
}

export function addPersonRole(person, role) {
  if (!person || person.type !== 'person') throw new TypeError('Valid person is required');
  const normalizedRole = normalizeRole(role);
  if (person.roles.includes(normalizedRole)) return person;
  return Object.freeze({ ...person, roles: [...person.roles, normalizedRole] });
}
