/** Follow/alert primitives. Delivery is intentionally adapter-owned. */

export const FOLLOW_TYPES = Object.freeze(['sport', 'competition', 'team', 'athlete', 'event']);

export function createFollow({ userId, type, targetId, createdAt = new Date().toISOString() }) {
  if (!userId || !FOLLOW_TYPES.includes(type) || !targetId) throw new TypeError('Invalid follow');
  return Object.freeze({ userId, type, targetId, createdAt });
}

export function createAlertCandidate({ follow, eventId, reason, priority = 'normal', createdAt = new Date().toISOString() }) {
  if (!follow || !eventId || !reason) throw new TypeError('Invalid alert candidate');
  if (!['low', 'normal', 'high'].includes(priority)) throw new TypeError('Invalid alert priority');
  return Object.freeze({ follow, eventId, reason, priority, createdAt });
}
