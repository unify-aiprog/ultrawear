/** Pure follow-trigger evaluation. Produces candidates; never delivers notifications. */

import { createAlertCandidate, FOLLOW_TYPES } from './follow.js';

export const ALERT_REASONS = Object.freeze([
  'event_started',
  'score_changed',
  'status_changed',
  'event_finished',
  'event_postponed',
]);

const HIGH_PRIORITY = new Set(['event_started', 'event_finished']);

function targetIds(event) {
  return {
    sport: event.sport,
    competition: event.competition,
    team: [event.home?.id, event.away?.id].filter(Boolean),
    athlete: [event.home?.athletes, event.away?.athletes]
      .flat()
      .map((athlete) => athlete?.id)
      .filter(Boolean),
    event: event.id,
  };
}

function matches(follow, event) {
  if (!FOLLOW_TYPES.includes(follow?.type) || !follow.targetId) return false;
  const ids = targetIds(event)[follow.type];
  return Array.isArray(ids) ? ids.includes(follow.targetId) : ids === follow.targetId;
}

export function getEventTriggerReasons(previous, current) {
  if (!current?.id) return [];
  if (!previous) return current.status === 'live' ? ['event_started'] : [];

  const reasons = [];
  if (previous.status !== current.status) {
    if (current.status === 'live') reasons.push('event_started');
    else if (current.status === 'finished') reasons.push('event_finished');
    else if (current.status === 'postponed') reasons.push('event_postponed');
    else reasons.push('status_changed');
  }
  if (JSON.stringify(previous.score) !== JSON.stringify(current.score)) reasons.push('score_changed');
  return reasons.filter((reason) => ALERT_REASONS.includes(reason));
}

export function createAlertFingerprint({ follow, eventId, reason }) {
  return [follow.userId, follow.type, follow.targetId, eventId, reason].join(':');
}

export function createAlertCandidates({ previous = null, current, follows = [], createdAt = new Date().toISOString() }) {
  if (!current?.id) throw new TypeError('Current event is required');
  const reasons = getEventTriggerReasons(previous, current);
  const seen = new Set();
  const candidates = [];

  for (const follow of follows) {
    for (const reason of reasons) {
      if (!matches(follow, current)) continue;
      const fingerprint = createAlertFingerprint({ follow, eventId: current.id, reason });
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      candidates.push(createAlertCandidate({
        follow,
        eventId: current.id,
        reason,
        priority: HIGH_PRIORITY.has(reason) ? 'high' : 'normal',
        createdAt,
      }));
    }
  }

  return candidates;
}
