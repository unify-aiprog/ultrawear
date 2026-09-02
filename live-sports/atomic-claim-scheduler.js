/**
 * Provider-neutral scheduler wrapper for schedulers that support atomic claims.
 *
 * Persistence-only schedulers remain valid and are intentionally not upgraded
 * to pretend they provide distributed locking.
 */

export function createAtomicClaimScheduler({ scheduler, claim, leaseSeconds = 60, now = () => Date.now() } = {}) {
  if (!scheduler || typeof scheduler.due !== 'function' || typeof scheduler.schedule !== 'function') throw new TypeError('scheduler with due and schedule is required');
  if (typeof claim !== 'function') throw new TypeError('atomic claim function is required');

  return Object.freeze({
    async due(at = now()) { return scheduler.due(at); },
    async schedule(sourceId, context = {}, delaySeconds = 30) { return scheduler.schedule(sourceId, context, delaySeconds); },
    async claim(sourceId, { at = now(), leaseSeconds: requestedLease = leaseSeconds } = {}) {
      if (!sourceId) throw new TypeError('sourceId is required');
      return Boolean(await claim(sourceId, { leaseSeconds: requestedLease, now: at }));
    },
    async remove(sourceId) { if (typeof scheduler.remove !== 'function') return; return scheduler.remove(sourceId); },
    async list() { if (typeof scheduler.list !== 'function') return []; return scheduler.list(); },
  });
}
