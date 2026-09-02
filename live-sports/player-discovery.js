/**
 * Deterministic player discovery signals.
 *
 * Ranking is evidence-driven: missing data contributes no points, upcoming
 * events only matter when the player is actually associated with a team in
 * that event, and every returned reason maps to an inspectable signal.
 */

function finite(value) {
  return Number.isFinite(value) ? value : null;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function ids(values) {
  return new Set((Array.isArray(values) ? values : []).filter(Boolean));
}

function contributionScore(history) {
  const rows = Array.isArray(history) ? history.slice(0, 5) : [];
  let score = 0;
  let evidence = 0;

  rows.forEach((row, index) => {
    const stats = row?.stats && typeof row.stats === 'object' ? row.stats : {};
    const weight = [5, 4, 3, 2, 1][index] || 1;
    const goals = finite(stats.goals);
    const assists = finite(stats.assists);
    const minutes = finite(row?.minutes);

    if (goals != null) {
      score += Math.min(goals, 3) / 3 * 45 * weight;
      evidence += 1;
    }
    if (assists != null) {
      score += Math.min(assists, 3) / 3 * 25 * weight;
      evidence += 1;
    }
    if (minutes != null) {
      score += Math.min(minutes / 90, 1) * 30 * weight;
      evidence += 1;
    }
  });

  const denominator = rows.length ? 125 * rows.length : 1;
  return { score: clamp(score / denominator * 100), evidence, sampleSize: rows.length };
}

function upcomingScore(player, upcomingEvents = []) {
  const teamIds = ids(player?.teamIds);
  const matches = (Array.isArray(upcomingEvents) ? upcomingEvents : []).filter((event) => {
    if (event?.status !== 'scheduled') return false;
    return teamIds.has(event?.home?.id) || teamIds.has(event?.away?.id);
  });

  if (!matches.length) return { score: 0, matches: [] };
  return { score: clamp(40 + Math.min(matches.length, 3) * 20), matches: matches.slice(0, 3) };
}

export function rankPlayersToWatch(candidates = [], { now = new Date().toISOString() } = {}) {
  const rows = Array.isArray(candidates) ? candidates : [];

  return rows.map((candidate) => {
    const form = contributionScore(candidate?.history);
    const upcoming = upcomingScore(candidate?.player, candidate?.upcomingEvents);
    const confidence = clamp((form.evidence / Math.max(1, form.sampleSize * 3)) * 100);
    const score = clamp(form.score * 0.7 + upcoming.score * 0.2 + confidence * 0.1);
    const reasons = [];

    if (form.score >= 35) reasons.push('Recent performance evidence');
    if (upcoming.matches.length) reasons.push('Upcoming event involving current team');
    if (confidence >= 70) reasons.push('Strong recent data coverage');

    return {
      personId: candidate?.personId || candidate?.player?.personId || null,
      score: Math.round(score * 10) / 10,
      confidence: Math.round(confidence) / 100,
      signals: {
        recentPerformance: Math.round(form.score * 10) / 10,
        upcomingEvent: Math.round(upcoming.score * 10) / 10,
      },
      reasons,
      upcomingEvents: upcoming.matches,
      sampleSize: form.sampleSize,
      evaluatedAt: now,
    };
  }).sort((a, b) => b.score - a.score);
}
