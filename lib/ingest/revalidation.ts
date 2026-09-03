import { createHash } from 'node:crypto';
import { getSupabaseServerClient } from '@/lib/supabase';
import { listMatches, type FootballDataMatch } from '@/lib/providers/football-data';
import { createObservation, reconcile, type SourceObservation } from '@/lib/sports/contracts';

export type SportsProviderAdapter<T> = {
  id: string;
  sourceType: 'official' | 'secondary' | 'community' | 'editorial';
  fetch: (window: { from: string; to: string }) => Promise<T[]>;
  normalize: (item: T) => { entityType: string; entityId: string; observedAt: string; freshnessAt?: string; payload: unknown };
};

export type RevalidationSummary = {
  provider: string;
  fetched: number;
  persisted: number;
  verified: number;
  conflicted: number;
  insufficientEvidence: number;
  failed: number;
};

const hashPayload = (payload: unknown) => createHash('sha256').update(JSON.stringify(payload)).digest('hex');

export const footballMatchAdapter: SportsProviderAdapter<FootballDataMatch> = {
  id: 'football-data.org',
  sourceType: 'official',
  fetch: async ({ from, to }) => (await listMatches({ dateFrom: from, dateTo: to })).matches,
  normalize: (match) => ({
    entityType: 'event',
    entityId: `event_footballdataorg_${match.id}`,
    observedAt: new Date().toISOString(),
    freshnessAt: match.status === 'FINISHED' ? undefined : new Date(Date.now() + 5 * 60_000).toISOString(),
    payload: {
      sport: 'football',
      providerId: String(match.id),
      status: match.status,
      startTime: match.utcDate,
      competitionId: String(match.competition.id),
      seasonId: String(match.season.id),
      homeTeamId: String(match.homeTeam.id),
      awayTeamId: String(match.awayTeam.id),
      homeScore: match.score?.fullTime?.home ?? null,
      awayScore: match.score?.fullTime?.away ?? null,
    },
  }),
};

export async function revalidateSports<T>(adapter: SportsProviderAdapter<T>, options: { from?: Date; to?: Date; confidence?: number } = {}): Promise<RevalidationSummary> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const from = (options.from ?? new Date(Date.now() - 2 * 86_400_000)).toISOString().slice(0, 10);
  const to = (options.to ?? new Date(Date.now() + 2 * 86_400_000)).toISOString().slice(0, 10);
  const items = await adapter.fetch({ from, to });
  const summary: RevalidationSummary = { provider: adapter.id, fetched: items.length, persisted: 0, verified: 0, conflicted: 0, insufficientEvidence: 0, failed: 0 };

  for (const item of items) {
    try {
      const normalized = adapter.normalize(item);
      const observationId = `${adapter.id}:${normalized.entityType}:${normalized.entityId}:${hashPayload(normalized.payload).slice(0, 16)}`;
      const observation = createObservation({
        id: observationId,
        sourceId: adapter.id,
        sourceType: adapter.sourceType,
        observedAt: normalized.observedAt,
        freshnessAt: normalized.freshnessAt,
        verification: 'verified',
        confidence: options.confidence ?? 0.9,
        payload: normalized.payload,
      });

      const { data: prior } = await supabase
        .from('sports_source_observations')
        .select('id,source_id,source_type,observed_at,freshness_at,verification,confidence,payload')
        .eq('entity_type', normalized.entityType)
        .eq('entity_id', normalized.entityId)
        .order('observed_at', { ascending: false })
        .limit(20);

      const observations = [...(prior ?? []).map((row) => row as SourceObservation), observation];
      const result = reconcile(observations, (a, b) => JSON.stringify(a) === JSON.stringify(b));
      const { error } = await supabase.from('sports_source_observations').upsert({
        id: observation.id,
        source_id: observation.sourceId,
        source_type: observation.sourceType,
        entity_type: normalized.entityType,
        entity_id: normalized.entityId,
        observed_at: observation.observedAt,
        freshness_at: observation.freshnessAt ?? null,
        verification: observation.verification,
        confidence: observation.confidence,
        payload: observation.payload,
        content_hash: hashPayload(observation.payload),
      }, { onConflict: 'id' });
      if (error) throw error;

      await supabase.from('sports_reconciliation_runs').insert({
        entity_type: normalized.entityType,
        entity_id: normalized.entityId,
        status: result.status,
        winner_observation_id: result.status === 'verified' ? observation.id : null,
        observation_ids: result.observationIds,
        conflict_ids: result.conflicts,
      });

      summary.persisted += 1;
      if (result.status === 'verified') summary.verified += 1;
      else if (result.status === 'conflicted') summary.conflicted += 1;
      else summary.insufficientEvidence += 1;
    } catch {
      summary.failed += 1;
    }
  }

  return summary;
}
