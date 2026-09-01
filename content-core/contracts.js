/**
 * Provider-neutral domain contracts for the UltraWear Content Core.
 *
 * Keep these objects boring and explicit. Adapters may add provider metadata,
 * but the core should never depend on a specific vendor or model.
 */

export const CONTENT_STATES = Object.freeze([
  'opportunity',
  'researching',
  'drafting',
  'verifying',
  'review',
  'approved',
  'published',
  'refresh_due',
  'archived',
]);

export const CONTENT_TYPES = Object.freeze([
  'breaking_update',
  'match_report',
  'match_preview',
  'analysis',
  'opinion',
  'explainer',
  'profile',
  'comparison',
  'trend_culture',
  'evergreen_guide',
  'local_community',
  'newsletter',
  'derivative',
]);

export const SIGNAL_TYPES = Object.freeze([
  'event',
  'trend',
  'question',
  'editorial_input',
  'community_signal',
]);

export function createSignal({
  id,
  type,
  title,
  source,
  observedAt,
  location = null,
  entities = [],
  confidence = 0,
  payload = {},
}) {
  if (!id || !SIGNAL_TYPES.includes(type) || !title || !source || !observedAt) {
    throw new TypeError('Invalid Content Core signal');
  }

  return Object.freeze({
    id,
    type,
    title,
    source,
    observedAt,
    location,
    entities: [...entities],
    confidence: clampScore(confidence),
    payload,
  });
}

export function createStory({
  id,
  type = 'breaking_update',
  title,
  canonicalSlug,
  summary = '',
  state = 'opportunity',
  signalIds = [],
  entities = [],
  evidence = [],
  author = null,
  editor = null,
  publishedAt = null,
  updatedAt = null,
}) {
  if (!id || !CONTENT_TYPES.includes(type) || !title || !canonicalSlug) {
    throw new TypeError('Invalid Content Core story');
  }
  if (!CONTENT_STATES.includes(state)) throw new TypeError('Invalid story state');

  return {
    id,
    type,
    title,
    canonicalSlug,
    summary,
    state,
    signalIds: [...signalIds],
    entities: [...entities],
    evidence: [...evidence],
    author,
    editor,
    publishedAt,
    updatedAt,
  };
}

export function createEvidence({
  sourceId,
  sourceType,
  locator = null,
  capturedAt,
  excerpt = null,
  confidence = 0,
}) {
  if (!sourceId || !sourceType || !capturedAt) {
    throw new TypeError('Invalid evidence record');
  }

  return Object.freeze({
    sourceId,
    sourceType,
    locator,
    capturedAt,
    excerpt,
    confidence: clampScore(confidence),
  });
}

export function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(1, Math.max(0, number));
}
