import { createHash } from 'node:crypto';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { createObservation, reconcile, type ReconciliationResult, type SourceObservation } from './contracts';

type EntityKey = { entityType: string; entityId: string };

export function observationHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export async function persistObservation(key: EntityKey, input: Omit<SourceObservation, 'confidence'> & { confidence?: number }) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error('Supabase service role is not configured');
  const observation = createObservation(input);
  const { data, error } = await supabase.from('sports_source_observations').upsert({
    id: observation.id,
    source_id: observation.sourceId,
    source_type: observation.sourceType,
    entity_type: key.entityType,
    entity_id: key.entityId,
    observed_at: observation.observedAt,
    freshness_at: observation.freshnessAt ?? null,
    verification: observation.verification,
    confidence: observation.confidence,
    payload: observation.payload,
    content_hash: observationHash(observation.payload),
  }, { onConflict: 'id' }).select('*').single();
  if (error || !data) throw new Error(`Unable to persist sports observation: ${error?.message ?? 'unknown error'}`);
  return observation;
}

export async function reconcilePersisted<T>(key: EntityKey, equals: (a: T, b: T) => boolean): Promise<ReconciliationResult<T>> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error('Supabase service role is not configured');
  const { data, error } = await supabase.from('sports_source_observations')
    .select('id,source_id,source_type,observed_at,freshness_at,verification,confidence,payload')
    .eq('entity_type', key.entityType)
    .eq('entity_id', key.entityId)
    .order('observed_at', { ascending: false });
  if (error) throw new Error(`Unable to load sports observations: ${error.message}`);

  const observations: SourceObservation[] = (data ?? []).map((row) => ({
    id: row.id,
    sourceId: row.source_id,
    sourceType: row.source_type,
    observedAt: row.observed_at,
    freshnessAt: row.freshness_at ?? undefined,
    verification: row.verification,
    confidence: Number(row.confidence),
    payload: row.payload,
  }));
  const result = reconcile(observations, equals);
  const winner = result.value === null ? null : observations.find((item) => item.confidence === Math.max(...observations.filter((item) => item.verification !== 'stale').map((item) => item.confidence)))?.id ?? null;

  const { error: historyError } = await supabase.from('sports_reconciliation_runs').insert({
    entity_type: key.entityType,
    entity_id: key.entityId,
    status: result.status,
    winner_observation_id: winner,
    observation_ids: result.observationIds,
    conflict_ids: result.conflicts,
  });
  if (historyError) throw new Error(`Unable to persist reconciliation history: ${historyError.message}`);
  return result;
}
