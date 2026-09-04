/** Provider-neutral read model for combining live sports feeds. */

const LIVE_STATUSES = new Set(['live', 'halftime']);

function eventTime(event) {
  const value = Date.parse(event?.startsAt ?? event?.updatedAt ?? '');
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function identity(event) {
  return event?.canonicalId ?? event?.id ?? null;
}

export function normalizeSportFeed(events = [], { sport = null, sourceId = null } = {}) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((event) => event && identity(event))
    .map((event) => ({
      ...event,
      sport: event.sport ?? sport,
      source: event.source ?? (sourceId ? { id: sourceId } : undefined),
    }));
}

export function combineSportFeeds(feeds = []) {
  const byIdentity = new Map();
  for (const feed of feeds) {
    for (const event of normalizeSportFeed(feed?.events, feed)) {
      const key = identity(event);
      const existing = byIdentity.get(key);
      if (!existing) {
        byIdentity.set(key, event);
        continue;
      }
      const existingLive = LIVE_STATUSES.has(existing.status);
      const incomingLive = LIVE_STATUSES.has(event.status);
      if (incomingLive && !existingLive) byIdentity.set(key, event);
      else if (incomingLive === existingLive && eventTime(event) < eventTime(existing)) byIdentity.set(key, event);
    }
  }
  return [...byIdentity.values()].sort((a, b) => {
    const liveDelta = Number(LIVE_STATUSES.has(b.status)) - Number(LIVE_STATUSES.has(a.status));
    if (liveDelta) return liveDelta;
    return eventTime(a) - eventTime(b);
  });
}

export function groupSportFeeds(events = []) {
  return events.reduce((groups, event) => {
    const key = String(event?.sport ?? 'Other').toLowerCase();
    const group = groups[key] ?? [];
    group.push(event);
    groups[key] = group;
    return groups;
  }, {});
}

export function selectLiveSportEvents(events = [], { limit = 8, sports = null } = {}) {
  const allowed = Array.isArray(sports) && sports.length
    ? new Set(sports.map((sport) => String(sport).toLowerCase()))
    : null;
  const boundedLimit = Math.min(50, Math.max(1, Number(limit) || 8));
  return combineSportFeeds([{ events }])
    .filter((event) => LIVE_STATUSES.has(event.status))
    .filter((event) => !allowed || allowed.has(String(event.sport ?? '').toLowerCase()))
    .slice(0, boundedLimit);
}
