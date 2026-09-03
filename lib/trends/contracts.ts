export type TrendLocationScope = 'near_you' | 'country' | 'region' | 'global' | 'personalized';
export type TrendSourceType = 'official' | 'secondary' | 'community' | 'editorial';

export interface TrendObservation {
  id: string;
  sourceId: string;
  sourceType: TrendSourceType;
  topicKey: string;
  title: string;
  observedAt: string;
  locationScope: TrendLocationScope;
  locationCode?: string;
  velocity: number;
  confidence: number;
  relevance: number;
  payload: unknown;
}

export interface TrendScore { velocity: number; confidence: number; relevance: number; score: number; }
const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function createTrendObservation(input: TrendObservation): TrendObservation {
  if (!input.id || !input.sourceId || !input.topicKey || !input.title || !input.observedAt || input.payload === undefined || input.payload === null) throw new TypeError('Invalid trend observation');
  return Object.freeze({ ...input, confidence: clamp(input.confidence), relevance: clamp(input.relevance), velocity: clamp(input.velocity) });
}

export function scoreTrend(observation: TrendObservation): TrendScore {
  const velocity = clamp(observation.velocity), confidence = clamp(observation.confidence), relevance = clamp(observation.relevance);
  return { velocity, confidence, relevance, score: velocity * 0.4 + confidence * 0.3 + relevance * 0.3 };
}

export function normalizeLocation(scope: TrendLocationScope, locationCode?: string) {
  if ((scope === 'near_you' || scope === 'personalized') && !locationCode) throw new TypeError(`${scope} trends require an opted-in coarse location code`);
  return { scope, locationCode: locationCode ?? null };
}
