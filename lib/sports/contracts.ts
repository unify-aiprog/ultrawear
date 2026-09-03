/**
 * Provider-neutral sports domain contracts.
 * Providers are adapters; these records are the UltraWear-owned vocabulary.
 */

export const SPORTS = ['football'] as const;
export type Sport = (typeof SPORTS)[number] | (string & {});
export type VerificationStatus = 'verified' | 'unverified' | 'conflicted' | 'stale';
export type SourceType = 'official' | 'secondary' | 'community' | 'editorial';

export interface SourceObservation {
  id: string;
  sourceId: string;
  sourceType: SourceType;
  observedAt: string;
  freshnessAt?: string;
  verification: VerificationStatus;
  confidence: number;
  payload: unknown;
}

export interface SportsEntity {
  id: string;
  sport: Sport;
  type: 'person' | 'player' | 'manager' | 'team' | 'competition' | 'season' | 'event' | 'performance' | 'moment';
  name: string;
  sourceIds: string[];
}

export interface SportsEvent {
  id: string;
  sport: Sport;
  competitionId?: string;
  seasonId?: string;
  status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled' | 'unknown';
  startTime?: string;
  participants: Array<{ entityId: string; role: 'home' | 'away' | 'participant' }>;
  observations: string[];
}

export interface ReconciliationResult<T> {
  value: T | null;
  status: 'verified' | 'conflicted' | 'insufficient_evidence';
  observationIds: string[];
  conflicts: string[];
}

const SOURCE_PRIORITY: Record<SourceType, number> = { official: 4, secondary: 3, editorial: 2, community: 1 };

export function clampConfidence(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function createObservation(input: Omit<SourceObservation, 'confidence'> & { confidence?: number }): SourceObservation {
  if (!input.id || !input.sourceId || !input.observedAt || input.payload === undefined || input.payload === null) {
    throw new TypeError('Invalid sports source observation');
  }
  const observedAt = Date.parse(input.observedAt);
  if (!Number.isFinite(observedAt)) throw new TypeError('Invalid observation timestamp');
  return Object.freeze({ ...input, confidence: clampConfidence(input.confidence ?? 0) });
}

export function reconcile<T>(observations: SourceObservation[], equals: (a: T, b: T) => boolean, now = Date.now()): ReconciliationResult<T> {
  if (!observations.length) return { value: null, status: 'insufficient_evidence', observationIds: [], conflicts: [] };
  const candidates = observations.filter((item) => {
    if (item.verification === 'stale') return false;
    if (item.freshnessAt && Date.parse(item.freshnessAt) <= now) return false;
    return true;
  });
  if (!candidates.length) return { value: null, status: 'insufficient_evidence', observationIds: observations.map((item) => item.id), conflicts: [] };

  const winner = [...candidates].sort((a, b) => {
    const sourceDelta = SOURCE_PRIORITY[b.sourceType] - SOURCE_PRIORITY[a.sourceType];
    return sourceDelta || b.confidence - a.confidence || Date.parse(b.observedAt) - Date.parse(a.observedAt);
  })[0];
  const conflicts = candidates.filter((item) => item.id !== winner.id && !equals(winner.payload as T, item.payload as T)).map((item) => item.id);
  return {
    value: conflicts.length ? null : winner.payload as T,
    status: conflicts.length ? 'conflicted' : 'verified',
    observationIds: candidates.map((item) => item.id),
    conflicts,
  };
}
