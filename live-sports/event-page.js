/** Stable view model for live event pages and downstream renderers. */

import { getFreshness } from './freshness.js';

export function createEventPageModel(event, { community = {}, related = [], now = new Date() } = {}) {
  if (!event?.id) throw new TypeError('Event is required');
  const freshness = getFreshness(event, now);
  return {
    id: event.id,
    type: 'sport_event',
    sport: event.sport,
    competition: event.competition,
    status: event.status,
    startsAt: event.startsAt,
    updatedAt: event.updatedAt,
    source: event.source,
    venue: event.venue,
    participants: [event.home, event.away],
    score: event.score,
    freshness,
    community: {
      reactions: community.reactions ?? 0,
      questions: community.questions ?? 0,
      polls: community.polls ?? 0,
      predictions: community.predictions ?? 0,
    },
    related,
  };
}
