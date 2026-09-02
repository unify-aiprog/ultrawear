/** Deterministic reconciliation helpers for canonical event observations. */

function score(observation) {
  const freshness = Date.parse(observation.observedAt ?? '') || 0;
  return (observation.confidence ?? 0) * 1_000_000_000_000 + freshness;
}

export function reconcileField(observations = []) {
  if (!Array.isArray(observations) || observations.length === 0) {
    return { value: null, state: 'unverified', sources: [], observations: [] };
  }

  const groups = new Map();
  for (const observation of observations) {
    const valueKey = JSON.stringify(observation.value);
    if (!groups.has(valueKey)) groups.set(valueKey, []);
    groups.get(valueKey).push(observation);
  }

  const ranked = [...groups.values()].sort((a, b) =>
    b.reduce((sum, item) => sum + score(item), 0) - a.reduce((sum, item) => sum + score(item), 0));
  const winner = ranked[0];
  const corroborated = winner.length > 1;

  return {
    value: winner[0].value,
    state: ranked.length > 1 ? 'conflicted' : corroborated ? 'verified' : 'unverified',
    sources: winner.map((item) => item.sourceId),
    observations,
  };
}
