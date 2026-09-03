import { createHash } from 'node:crypto';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { listMatches, type FootballDataMatch } from '@/lib/providers/football-data';
import { createObservation, reconcile, type SourceObservation } from '@/lib/sports/contracts';
import { upsertCanonicalEvent } from '@/lib/sports/canonical-graph';

export type SportsProviderAdapter<T> = { id: string; sourceType: 'official' | 'secondary' | 'community' | 'editorial'; fetch: (window: { from: string; to: string }) => Promise<T[]>; normalize: (item: T) => { entityType: string; entityId: string; observedAt: string; freshnessAt?: string; payload: unknown } };
export type RevalidationSummary = { provider: string; fetched: number; persisted: number; verified: number; conflicted: number; insufficientEvidence: number; failed: number };
const hashPayload = (payload: unknown) => createHash('sha256').update(JSON.stringify(payload)).digest('hex');
function rowToObservation(row: { id: string; source_id: string; source_type: SourceObservation['sourceType']; observed_at: string; freshness_at: string | null; verification: SourceObservation['verification']; confidence: number | string; payload: unknown }): SourceObservation { return createObservation({ id: row.id, sourceId: row.source_id, sourceType: row.source_type, observedAt: row.observed_at, freshnessAt: row.freshness_at ?? undefined, verification: row.verification, confidence: Number(row.confidence), payload: row.payload }); }
export const footballMatchAdapter: SportsProviderAdapter<FootballDataMatch> = {
  id: 'football-data.org', sourceType: 'official',
  fetch: async ({ from, to }) => (await listMatches({ dateFrom: from, dateTo: to })).matches,
  normalize: (match) => ({ entityType: 'event', entityId: `event_footballdataorg_${match.id}`, observedAt: new Date().toISOString(), freshnessAt: match.status === 'FINISHED' ? undefined : new Date(Date.now() + 5 * 60_000).toISOString(), payload: {
    sport: 'football', providerId: String(match.id), status: match.status, startTime: match.utcDate, competitionId: String(match.competition.id), competitionName: match.competition.name, competitionCode: match.competition.code ?? null,
    seasonId: String(match.season.id), seasonName: `${match.season.startDate.slice(0, 4)}/${match.season.endDate.slice(0, 4)}`, seasonStartDate: match.season.startDate, seasonEndDate: match.season.endDate,
    homeTeamId: String(match.homeTeam.id), homeTeamName: match.homeTeam.name, homeTeamCrest: match.homeTeam.crest ?? null, awayTeamId: String(match.awayTeam.id), awayTeamName: match.awayTeam.name, awayTeamCrest: match.awayTeam.crest ?? null,
    homeScore: match.score?.fullTime?.home ?? null, awayScore: match.score?.fullTime?.away ?? null,
  } }),
};
export async function revalidateSports<T>(adapter: SportsProviderAdapter<T>, options: { from?: Date; to?: Date; confidence?: number } = {}): Promise<RevalidationSummary> {
  const supabase = getSupabaseAdminClient(); if (!supabase) throw new Error('Supabase service role is not configured');
  const from = (options.from ?? new Date(Date.now() - 2 * 86_400_000)).toISOString().slice(0, 10); const to = (options.to ?? new Date(Date.now() + 2 * 86_400_000)).toISOString().slice(0, 10);
  const items = await adapter.fetch({ from, to }); const summary: RevalidationSummary = { provider: adapter.id, fetched: items.length, persisted: 0, verified: 0, conflicted: 0, insufficientEvidence: 0, failed: 0 };
  for (const item of items) {
    try {
      const normalized = adapter.normalize(item); const contentHash = hashPayload(normalized.payload);
      const observation = createObservation({ id: `${adapter.id}:${normalized.entityType}:${normalized.entityId}:${contentHash.slice(0, 16)}`, sourceId: adapter.id, sourceType: adapter.sourceType, observedAt: normalized.observedAt, freshnessAt: normalized.freshnessAt, verification: 'verified', confidence: options.confidence ?? 0.9, payload: normalized.payload });
      const { data: prior, error: priorError } = await supabase.from('sports_source_observations').select('id,source_id,source_type,observed_at,freshness_at,verification,confidence,payload').eq('entity_type', normalized.entityType).eq('entity_id', normalized.entityId).order('observed_at', { ascending: false }).limit(20); if (priorError) throw priorError;
      const result = reconcile([...(prior ?? []).map(rowToObservation), observation], (a, b) => JSON.stringify(a) === JSON.stringify(b));
      const { error: observationError } = await supabase.from('sports_source_observations').upsert({ id: observation.id, source_id: observation.sourceId, source_type: observation.sourceType, entity_type: normalized.entityType, entity_id: normalized.entityId, observed_at: observation.observedAt, freshness_at: observation.freshnessAt ?? null, verification: observation.verification, confidence: observation.confidence, payload: observation.payload, content_hash: contentHash }, { onConflict: 'id' }); if (observationError) throw observationError;
      const winnerId = result.status === 'verified' ? result.observationIds[0] ?? null : null;
      const { error: historyError } = await supabase.from('sports_reconciliation_runs').insert({ entity_type: normalized.entityType, entity_id: normalized.entityId, status: result.status, winner_observation_id: winnerId, observation_ids: result.observationIds, conflict_ids: result.conflicts }); if (historyError) throw historyError;
      if (result.status === 'verified' && result.value && normalized.entityType === 'event') await upsertCanonicalEvent(adapter.id, result.value as Parameters<typeof upsertCanonicalEvent>[1]);
      summary.persisted += 1; if (result.status === 'verified') summary.verified += 1; else if (result.status === 'conflicted') summary.conflicted += 1; else summary.insufficientEvidence += 1;
    } catch { summary.failed += 1; }
  }
  return summary;
}
