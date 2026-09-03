/**
 * Provider-neutral sports domain contracts.
 *
 * Providers are adapters. These records are the UltraWear-owned vocabulary
 * that the product and content layers consume.
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

export function clampConfidence(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function createObservation(input: Omit<SourceObservation, 'confidence'> & { confidence?: number }): SourceObservation {
  if (!input.id || !input.sourceId || !input.observedAt || !input.payload) {
    throw new TypeError('Invalid sports source observation');
  }
  return Object.freeze({ ...input, confidence: clampConfidence(input.confidence ?? 0) });
}

export function reconcile<T>(observations: SourceObservation[], equals: (a: T, b: T) => boolean): ReconciliationResult<T> {
  if (!observations.length) return { value: null, status: 'insufficient_evidence', observationIds: [], conflicts: [] };

  const candidates = observations.filter((item) => item.verification !== 'stale');
  if (!candidates.length) return { value: null, status: 'insufficient_evidence', observationIds: observations.map((item) => item.id), conflicts: [] };

  const winner = [...candidates].sort((a, b) => b.confidence - a.confidence)[0];
  const conflicts = candidates
    .filter((item) => item.id !== winner.id && !equals(winner.payload as T, item.payload as T))
    .map((item) => item.id);

  return {
    value: conflicts.length ? null : winner.payload as T,
    status: conflicts.length ? 'conflicted' : 'verified',
    observationIds: candidates.map((item) => item.id),
    conflicts,
  };
}
