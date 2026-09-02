/**
 * Durable, provider-neutral observations behind the UltraWear knowledge graph.
 *
 * Every accepted fact keeps provenance and freshness so later sources can
 * corroborate, supersede, or invalidate it without rewriting history.
 */

export const VERIFICATION_STATES = Object.freeze(['unverified', 'corroborated', 'conflicted', 'verified']);

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function observationScore(observation) {
  const confidence = Number(observation.confidence) || 0;
  const timestamp = Date.parse(observation.observedAt ?? '');
  const freshness = Number.isFinite(timestamp) ? timestamp / 1_000_000_000_000_000 : 0;
  return confidence * 1_000_000 + freshness;
}

export function createObservation({ entityId, entityType, field, value, sourceId, observedAt, confidence = 0.5 }) {
  if (!entityId || !entityType || !field || !sourceId || !observedAt) throw new TypeError('Invalid knowledge observation');
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new TypeError('Confidence must be between 0 and 1');
  if (!Number.isFinite(Date.parse(observedAt))) throw new TypeError('observedAt must be a valid date');
  return { entityId, entityType, field, value, sourceId, observedAt, confidence };
}

export function reconcileObservations(observations = []) {
  const groups = new Map();
  observations.forEach((observation) => {
    const key = `${observation.entityId}:${observation.entityType}:${observation.field}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(observation);
  });

  return [...groups.values()].map((group) => {
    const byValue = new Map();
    group.forEach((observation) => {
      const key = stable(observation.value);
      if (!byValue.has(key)) byValue.set(key, []);
      byValue.get(key).push(observation);
    });
    const ranked = [...byValue.values()].sort((a, b) => {
      const score = (items) => items.reduce((sum, item) => sum + observationScore(item), 0);
      return score(b) - score(a) || stable(a[0].value).localeCompare(stable(b[0].value));
    });
    const winner = ranked[0] ?? [];
    const sourceCount = new Set(winner.map((item) => item.sourceId)).size;
    const state = ranked.length > 1
      ? 'conflicted'
      : sourceCount > 1
        ? 'corroborated'
        : 'unverified';
    return {
      entityId: group[0].entityId,
      entityType: group[0].entityType,
      field: group[0].field,
      value: winner[0]?.value ?? null,
      verification: state,
      sources: [...new Set(group.map((item) => item.sourceId))],
      observedAt: group.reduce((latest, item) => item.observedAt > latest ? item.observedAt : latest, ''),
      observations: group,
    };
  });
}
