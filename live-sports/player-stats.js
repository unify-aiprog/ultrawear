/**
 * Deterministic player statistics derived from persisted event performances.
 * Missing values are not treated as zero; unavailable metrics remain null.
 */

const NUMBER_FIELDS = Object.freeze([
  'minutes', 'goals', 'assists', 'shots', 'shotsOnTarget', 'passes',
  'tackles', 'interceptions', 'fouls', 'yellowCards', 'redCards',
  'cleanSheets',
]);

function number(value) {
  return Number.isFinite(value) ? value : null;
}

export function aggregatePlayerStats(events = []) {
  const rows = Array.isArray(events) ? events : [];
  const stats = { appearances: rows.length, starts: 0 };

  for (const row of rows) {
    if (row.started === true) stats.starts += 1;
    if (number(row.minutes) != null) stats.minutes = (stats.minutes || 0) + row.minutes;

    const source = row.stats && typeof row.stats === 'object' ? row.stats : {};
    for (const field of NUMBER_FIELDS.slice(1)) {
      const value = number(source[field]);
      if (value != null) stats[field] = (stats[field] || 0) + value;
    }
  }

  return Object.freeze(stats);
}

export function recentPlayerForm(events = [], limit = 5) {
  const rows = Array.isArray(events) ? events.slice(0, Math.max(0, limit)) : [];
  return rows.map((row) => ({
    eventId: row.eventId,
    startsAt: row.startsAt || null,
    minutes: number(row.minutes),
    stats: row.stats && typeof row.stats === 'object' ? { ...row.stats } : {},
  }));
}
