/**
 * Deterministic, explainable player intelligence signals.
 * Scores are deliberately simple and inspectable; no LLM is required.
 */

function finite(value) {
  return Number.isFinite(value) ? value : null;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function playerIntelligence(events = [], { window = 5 } = {}) {
  const rows = Array.isArray(events) ? events.slice(0, Math.max(1, window)) : [];
  const weights = [5, 4, 3, 2, 1];
  let score = 0;
  let evidence = 0;

  rows.forEach((row, index) => {
    const weight = weights[index] || 1;
    const stats = row.stats && typeof row.stats === 'object' ? row.stats : {};
    const goals = finite(stats.goals);
    const assists = finite(stats.assists);
    const minutes = finite(row.minutes);

    if (goals != null) { score += goals * 12 * weight; evidence += 1; }
    if (assists != null) { score += assists * 8 * weight; evidence += 1; }
    if (minutes != null) { score += Math.min(minutes / 90, 1) * 4 * weight; evidence += 1; }
  });

  const normalized = rows.length ? clamp(score / Math.max(1, rows.length * 5)) : 0;
  return Object.freeze({
    score: Math.round(normalized * 10) / 10,
    confidence: rows.length ? Math.round(Math.min(1, evidence / (rows.length * 3)) * 100) / 100 : 0,
    sampleSize: rows.length,
    reasons: [
      ...(rows.some((row) => finite(row.stats?.goals) > 0) ? ['Recent goal contributions'] : []),
      ...(rows.some((row) => finite(row.stats?.assists) > 0) ? ['Recent assist contributions'] : []),
      ...(rows.some((row) => finite(row.minutes) >= 60) ? ['Regular recent playing time'] : []),
    ],
  });
}
