/**
 * Team match-history catalogue backed by Cloudflare KV.
 *
 * The catalogue is derived from canonical events, so a team history keeps the
 * same event identity used by the permanent event centre.
 */

function key(teamId) {
  return `team:${teamId}:matches`;
}

function summary(event, teamId) {
  const isHome = event.home?.id === teamId;
  const isAway = event.away?.id === teamId;
  if (!isHome && !isAway) return null;
  return {
    eventId: event.id,
    sport: event.sport,
    competition: event.competition,
    startsAt: event.startsAt,
    status: event.status,
    teamId,
    opponent: isHome ? event.away : event.home,
    home: event.home,
    away: event.away,
    score: event.score ?? null,
    updatedAt: event.updatedAt ?? null,
  };
}

export function createTeamHistoryStore(namespace) {
  if (!namespace || typeof namespace.get !== 'function' || typeof namespace.put !== 'function') {
    throw new TypeError('Team history KV namespace is required');
  }

  return Object.freeze({
    async list(teamId) {
      if (!teamId) throw new TypeError('Team id is required');
      const value = await namespace.get(key(teamId), 'json');
      return Array.isArray(value) ? value : [];
    },

    async put(event) {
      if (!event?.id) throw new TypeError('Event is required');
      const teamIds = [event.home?.id, event.away?.id].filter(Boolean);
      for (const teamId of teamIds) {
        const match = summary(event, teamId);
        if (!match) continue;
        const matches = await this.list(teamId);
        const next = matches.filter((item) => item.eventId !== event.id);
        next.push(match);
        next.sort((a, b) => String(b.startsAt).localeCompare(String(a.startsAt)));
        await namespace.put(key(teamId), JSON.stringify(next));
      }
      return event;
    },
  });
}
