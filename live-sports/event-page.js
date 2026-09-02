/** Stable view model for live event pages and downstream renderers. */

import { getFreshness } from './freshness.js';

export const MOMENT_ANIMATIONS = Object.freeze({
  goal: 'goal', own_goal: 'own-goal', penalty_goal: 'penalty', penalty_miss: 'penalty-miss',
  penalty_awarded: 'penalty-awarded', substitution: 'substitution', yellow_card: 'yellow-card',
  red_card: 'red-card', second_yellow: 'second-yellow', var: 'var', injury: 'injury',
  kickoff: 'kickoff', halftime: 'halftime', fulltime: 'fulltime', extra_time: 'extra-time',
  shootout: 'shootout', transfer: 'transfer', manager_sacked: 'manager-sacked',
  manager_appointed: 'manager-appointed', retirement: 'retirement', milestone: 'milestone',
  award: 'award', record: 'record', disqualification: 'disqualification', result: 'result', other: 'generic',
});

function prepareMoment(moment) {
  if (!moment) return null;
  return {
    ...moment,
    animation: moment.animation ?? { key: MOMENT_ANIMATIONS[moment.type] ?? 'generic', replayable: true },
  };
}

export function createEventPageModel(event, { community = {}, related = [], now = new Date() } = {}) {
  if (!event?.id) throw new TypeError('Event is required');
  const freshness = getFreshness(event, now);
  const moments = (Array.isArray(event.moments) ? event.moments : []).map(prepareMoment);
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
    moment: prepareMoment(event.moment),
    moments,
    animationTimeline: moments.map((item) => ({
      id: item.id,
      type: item.type,
      occurredAt: item.occurredAt,
      minute: item.minute,
      animation: item.animation,
      verified: item.verified,
    })),
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
