const REVISION_ACTIONS = Object.freeze(['created', 'edited', 'corrected', 'approved', 'rejected']);

export function createRevision({ storyId, revision, actor, action = 'edited', changes = {}, reason = '' }) {
  if (!storyId || !revision || !actor) throw new TypeError('storyId, revision and actor are required');
  if (!REVISION_ACTIONS.includes(action)) throw new TypeError('Invalid revision action');
  return Object.freeze({
    storyId,
    revision,
    actor,
    action,
    changes: { ...changes },
    reason,
    at: new Date().toISOString(),
  });
}

export function appendRevision(history, entry) {
  if (!Array.isArray(history)) throw new TypeError('Revision history must be an array');
  return [...history, entry];
}

export function latestRevision(history) {
  return Array.isArray(history) && history.length ? history[history.length - 1] : null;
}

export { REVISION_ACTIONS };
