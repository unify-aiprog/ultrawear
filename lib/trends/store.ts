import { getSupabaseAdminClient } from '@/lib/supabase';
import { createTrendObservation, scoreTrend, type TrendObservation } from './contracts';

function db() {
  const client = getSupabaseAdminClient();
  if (!client) throw new Error('Supabase service role is not configured');
  return client;
}

export async function saveTrendObservation(input: TrendObservation) {
  const trend = createTrendObservation(input);
  const score = scoreTrend(trend);
  const { data, error } = await db().from('trend_signals').upsert({
    id: trend.id, source_id: trend.sourceId, source_type: trend.sourceType, topic_key: trend.topicKey,
    title: trend.title, observed_at: trend.observedAt, location_scope: trend.locationScope,
    location_code: trend.locationCode ?? null, velocity: score.velocity, confidence: score.confidence,
    relevance: score.relevance, payload: trend.payload,
  }, { onConflict: 'id' }).select('*').single();
  if (error || !data) throw new Error(`Unable to persist trend observation: ${error?.message ?? 'unknown error'}`);
  return { trend, score };
}

export async function queueEditorialOpportunity(input: { id: string; trendSignalIds: string[]; title: string; reason: string; confidence: number }) {
  const { data, error } = await db().from('editorial_opportunities').upsert({
    id: input.id, trend_signal_ids: input.trendSignalIds, title: input.title, reason: input.reason,
    status: 'queued', confidence: Math.min(1, Math.max(0, input.confidence)), updated_at: new Date().toISOString(),
  }, { onConflict: 'id' }).select('*').single();
  if (error || !data) throw new Error(`Unable to queue editorial opportunity: ${error?.message ?? 'unknown error'}`);
  return data;
}
