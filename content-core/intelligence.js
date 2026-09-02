import { clampScore, CONTENT_TYPES, createSignal } from './contracts.js';

const DEFAULT_WEIGHTS = Object.freeze({
  velocity: 0.25,
  relevance: 0.2,
  freshness: 0.15,
  sourceConfidence: 0.2,
  localRelevance: 0.1,
  culturalRelevance: 0.1,
});

const OPPORTUNITY_TYPES = new Set(CONTENT_TYPES);

function normalizeText(value = '') {
  return String(value).toLowerCase().trim().replace(/\s+/g, ' ');
}

function dayBucket(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'invalid';
  return date.toISOString().slice(0, 10);
}

export function normalizeSignal(input) {
  const signal = createSignal(input);
  return {
    ...signal,
    title: signal.title.trim(),
    entities: [...new Set(signal.entities.map(normalizeText).filter(Boolean))],
  };
}

export function signalFingerprint(signal) {
  const entities = [...(signal.entities || [])].map(normalizeText).sort().join('|');
  const location = normalizeText(signal.location || 'global');
  return [signal.type, normalizeText(signal.title), entities, location, dayBucket(signal.observedAt)].join('::');
}

export function scoreSignal(signal, context = {}, weights = DEFAULT_WEIGHTS) {
  const observed = new Date(signal.observedAt).getTime();
  const ageHours = Number.isFinite(observed) ? Math.max(0, (Date.now() - observed) / 36e5) : 9999;
  const freshness = clampScore(1 - ageHours / 48);
  const velocity = clampScore(context.velocity ?? signal.payload?.velocity ?? 0);
  const relevance = clampScore(context.relevance ?? signal.payload?.relevance ?? 0);
  const sourceConfidence = clampScore(signal.confidence);
  const localRelevance = clampScore(context.localRelevance ?? signal.payload?.localRelevance ?? 0);
  const culturalRelevance = clampScore(context.culturalRelevance ?? signal.payload?.culturalRelevance ?? 0);

  const factors = { velocity, relevance, freshness, sourceConfidence, localRelevance, culturalRelevance };
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
  const score = Object.entries(weights).reduce((sum, [key, weight]) => sum + factors[key] * Number(weight || 0), 0) / totalWeight;

  return { score: clampScore(score), factors };
}

export function clusterSignals(signals) {
  const clusters = new Map();
  for (const raw of signals) {
    const signal = normalizeSignal(raw);
    const key = signalFingerprint(signal);
    const existing = clusters.get(key);
    if (existing) existing.signals.push(signal);
    else clusters.set(key, { key, signals: [signal] });
  }
  return [...clusters.values()].map((cluster) => ({
    ...cluster,
    signalIds: cluster.signals.map((signal) => signal.id),
    representative: cluster.signals.slice().sort((a, b) => b.confidence - a.confidence)[0],
  }));
}

export function createStoryOpportunities(signals, context = {}, options = {}) {
  const threshold = clampScore(options.threshold ?? 0.55);
  const clusters = clusterSignals(signals);

  return clusters
    .map((cluster) => {
      const scored = cluster.signals.map((signal) => ({ signal, ...scoreSignal(signal, context) }));
      const best = scored.sort((a, b) => b.score - a.score)[0];
      if (!best || best.score < threshold) return null;

      const signal = best.signal;
      const requestedType = options.type || signal.payload?.contentType || 'breaking_update';
      const type = OPPORTUNITY_TYPES.has(requestedType) ? requestedType : 'breaking_update';
      const id = `opportunity_${cluster.key.replace(/[^a-z0-9]+/gi, '_').slice(0, 96)}`;

      return {
        id,
        type,
        title: signal.title,
        canonicalKey: cluster.key,
        signalIds: cluster.signalIds,
        entityIds: signal.entities,
        location: signal.location,
        priority: best.score,
        confidence: signal.confidence,
        scoreFactors: best.factors,
        reasonCodes: buildReasonCodes(best.factors),
        status: 'open',
        createdAt: new Date().toISOString(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.priority - a.priority);
}

function buildReasonCodes(factors) {
  return Object.entries(factors)
    .filter(([, value]) => value >= 0.7)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}
