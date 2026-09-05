import { getSupabaseServerClient } from '@/lib/supabase';
import { buildSportsProgramme, type SportsProgramme } from '@/lib/sports/programme';
import { sportsProviders } from '@/lib/sports/providers';
import type { NormalizedSportsEvent, ProviderHealth, SportSlug } from '@/lib/sports/types';

const HORIZON_HOURS = 7 * 24;
const STALE_LIVE_HOURS = 4;

type StoredEventRow = {
  id: string; sport: string; starts_at: string; status: NormalizedSportsEvent['status']; competition: string; stage: string | null;
  home: NormalizedSportsEvent['home']; away: NormalizedSportsEvent['away']; participants: NormalizedSportsEvent['participants'];
  home_score: number | null; away_score: number | null; provider: string; provider_id: string; updated_at: string;
};

export async function refreshSportsBrain() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Supabase is not configured');
  const now = new Date();
  const future = new Date(now.getTime() + HORIZON_HOURS * 3_600_000);
  const recent = new Date(now.getTime() - 12 * 3_600_000);
  const allEvents: NormalizedSportsEvent[] = [];
  const health: ProviderHealth[] = [];
  for (const provider of sportsProviders) {
    try {
      const [live, upcoming, finished, providerHealth] = await Promise.all([provider.getLiveEvents(), provider.getUpcomingEvents(now, future), provider.getRecentEvents(recent, now), provider.getHealth()]);
      allEvents.push(...live, ...upcoming, ...finished);
      health.push(providerHealth);
    } catch (error) {
      health.push({ provider: provider.name, sport: provider.sport, status: 'down', checkedAt: new Date().toISOString(), error: error instanceof Error ? error.message : 'Unknown provider error' });
    }
  }
  const deduped = [...new Map(allEvents.map((event) => [event.id, event])).values()];
  const programme = buildSportsProgramme(deduped, 'all', now.getTime(), summarizeHealth(health));
  const ranked = new Map([...programme.now, ...programme.next, ...programme.tonight, ...programme.tomorrow, ...programme.thisWeekend, ...programme.recent].map((item) => [item.id, item]));
  if (deduped.length) {
    const rows = deduped.map((event) => ({ id: event.id, sport: event.sport, starts_at: event.startsAt, status: event.status, competition: event.competition, stage: event.stage ?? null, home: event.home ?? null, away: event.away ?? null, participants: event.participants ?? null, home_score: event.homeScore ?? null, away_score: event.awayScore ?? null, provider: event.provider, provider_id: event.providerId, updated_at: event.updatedAt ?? new Date().toISOString(), importance: ranked.get(event.id)?.importance ?? 0, priority: ranked.get(event.id)?.priority ?? 'BACKGROUND' }));
    const { error } = await supabase.from('sports_brain_events').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`Unable to persist Sports Brain events: ${error.message}`);
  }
  const { error: staleError } = await supabase.from('sports_brain_events').update({ status: 'FINISHED', updated_at: new Date().toISOString() }).in('status', ['IN_PLAY', 'PAUSED']).lt('starts_at', new Date(Date.now() - STALE_LIVE_HOURS * 3_600_000).toISOString());
  if (staleError) throw new Error(`Unable to reconcile stale Sports Brain events: ${staleError.message}`);
  const { error: healthError } = await supabase.from('sports_brain_provider_health').upsert(health.map((item) => ({ provider: item.provider, sport: item.sport, status: item.status, checked_at: item.checkedAt, last_success_at: item.lastSuccessAt ?? null, latency_ms: item.latencyMs ?? null, error: item.error ?? null })), { onConflict: 'provider' });
  if (healthError) throw new Error(`Unable to persist provider health: ${healthError.message}`);
  const ids = (items: { id: string }[]) => items.map((item) => item.id);
  const { error: programmeError } = await supabase.from('sports_brain_programme_state').upsert({ id: 'global', lead_event_id: programme.lead?.id ?? null, live_event_ids: ids(programme.now), next_event_ids: ids(programme.next), tonight_event_ids: ids(programme.tonight), tomorrow_event_ids: ids(programme.tomorrow), weekend_event_ids: ids(programme.thisWeekend), recent_event_ids: ids(programme.recent), editorial_priority: programme.lead?.priority ?? null, programme, source_health: health, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (programmeError) throw new Error(`Unable to persist programme state: ${programmeError.message}`);
  return { programme, events: deduped.length, providers: health };
}

export async function getStoredProgramme(): Promise<{ programme: SportsProgramme; sourceHealth: unknown; updatedAt: string } | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from('sports_brain_programme_state').select('programme,source_health,updated_at').eq('id', 'global').maybeSingle();
  if (error || !data?.programme) return null;
  return { programme: data.programme as SportsProgramme, sourceHealth: data.source_health, updatedAt: data.updated_at };
}

export async function getSportProgramme(sport: SportSlug): Promise<SportsProgramme> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return buildSportsProgramme([], sport);
  const horizon = new Date(Date.now() + HORIZON_HOURS * 3_600_000).toISOString();
  const recent = new Date(Date.now() - 12 * 3_600_000).toISOString();
  const { data, error } = await supabase.from('sports_brain_events').select('id,sport,starts_at,status,competition,stage,home,away,participants,home_score,away_score,provider,provider_id,updated_at').eq('sport', sport).gte('starts_at', recent).lte('starts_at', horizon).limit(200);
  if (error) return buildSportsProgramme([], sport);
  const events = (data as StoredEventRow[]).map((row) => ({ id: row.id, sport: row.sport, startsAt: row.starts_at, status: row.status, competition: row.competition, stage: row.stage, home: row.home, away: row.away, participants: row.participants, homeScore: row.home_score, awayScore: row.away_score, provider: row.provider, providerId: row.provider_id, updatedAt: row.updated_at }));
  return buildSportsProgramme(events, sport);
}

function summarizeHealth(health: ProviderHealth[]) {
  return health.reduce((summary, item) => {
    if (item.status === 'healthy') summary.healthy += 1;
    else if (item.status === 'degraded') summary.degraded += 1;
    else if (item.status === 'down') summary.down += 1;
    else summary.notConfigured += 1;
    return summary;
  }, { healthy: 0, degraded: 0, down: 0, notConfigured: 0 });
}
