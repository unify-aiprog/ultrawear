import { getSupabaseServerClient } from '@/lib/supabase';
import { cacheGet, cacheSet } from '@/lib/cache';
import { listMatches, type FootballDataMatch } from '@/lib/providers/football-data';
import { canonicalEventStatus, canonicalId, canonicalSlug, EVENT_STATUSES, PROVIDERS } from '@/lib/catalogue/identity';

const LIVE_CACHE_KEY = 'ultrawear:football:live:v1';
export type LiveEvent = { id: string; starts_at: string; status: string; home_score: number | null; away_score: number | null; competition: string; home_team: { name: string; crest_url: string | null }; away_team: { name: string; crest_url: string | null } };
const LIVE_STATUSES = [EVENT_STATUSES.IN_PLAY, EVENT_STATUSES.PAUSED];

type LiveRow = {
  id: string;
  starts_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  competition: { name: string } | { name: string }[] | null;
  home_team: { name: string; crest_url: string | null } | { name: string; crest_url: string | null }[] | null;
  away_team: { name: string; crest_url: string | null } | { name: string; crest_url: string | null }[] | null;
};

export async function ingestFootballLive() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Supabase is not configured');
  const { matches: inPlay } = await listMatches({ status: EVENT_STATUSES.IN_PLAY });
  const { matches: paused } = await listMatches({ status: EVENT_STATUSES.PAUSED });
  const matches = dedupe([...inPlay, ...paused]);
  for (const match of matches) await upsertLiveMatch(supabase, match);

  const { error: staleError } = await supabase.from('events_v2')
    .update({ status: EVENT_STATUSES.FINISHED, updated_at: new Date().toISOString() })
    .in('status', LIVE_STATUSES)
    .lt('starts_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString());
  if (staleError) throw new Error(`Unable to reconcile stale live events: ${staleError.message}`);

  const events = await readLiveEvents(supabase);
  const cached = await cacheSet(LIVE_CACHE_KEY, events, 90);
  return { live: events.length, updated: matches.length, cached };
}

export async function getLiveEvents(): Promise<LiveEvent[]> {
  const cached = await cacheGet<LiveEvent[]>(LIVE_CACHE_KEY);
  if (cached !== null) return cached;
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  try {
    return await readLiveEvents(supabase);
  } catch {
    return [];
  }
}

async function readLiveEvents(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>): Promise<LiveEvent[]> {
  const { data, error } = await supabase.from('events_v2')
    .select('id,starts_at,status,home_score,away_score,competition:competitions_v2(name),home_team:teams_v2!events_v2_home_team_id_fkey(name,crest_url),away_team:teams_v2!events_v2_away_team_id_fkey(name,crest_url)')
    .in('status', LIVE_STATUSES).order('starts_at', { ascending: true });
  if (error) throw new Error(`Unable to read live events: ${error.message}`);
  if (!data) return [];
  return (data as unknown as LiveRow[]).map((row) => ({
    id: row.id, starts_at: row.starts_at, status: canonicalEventStatus(row.status) ?? EVENT_STATUSES.IN_PLAY, home_score: row.home_score, away_score: row.away_score,
    competition: Array.isArray(row.competition) ? row.competition[0]?.name ?? 'Football' : row.competition?.name ?? 'Football',
    home_team: Array.isArray(row.home_team) ? row.home_team[0] ?? { name: 'Home', crest_url: null } : row.home_team ?? { name: 'Home', crest_url: null },
    away_team: Array.isArray(row.away_team) ? row.away_team[0] ?? { name: 'Away', crest_url: null } : row.away_team ?? { name: 'Away', crest_url: null },
  }));
}

async function upsertLiveMatch(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, match: FootballDataMatch) {
  const competitionId = canonicalId('competition', PROVIDERS.FOOTBALL_DATA, match.competition.id);
  const seasonId = canonicalId('season', PROVIDERS.FOOTBALL_DATA, match.season.id);
  const homeTeamId = await ensureTeam(supabase, match.homeTeam.id, match.homeTeam.name, match.homeTeam.crest);
  const awayTeamId = await ensureTeam(supabase, match.awayTeam.id, match.awayTeam.name, match.awayTeam.crest);
  if (!homeTeamId || !awayTeamId) throw new Error(`Unable to resolve teams for live match ${match.id}`);
  const status = canonicalEventStatus(match.status);
  if (!status) throw new Error(`Unsupported event status ${match.status} for live match ${match.id}`);
  const { error } = await supabase.from('events_v2').upsert({ id: canonicalId('event', PROVIDERS.FOOTBALL_DATA, match.id), sport_id: 'football', competition_id: competitionId, season_id: seasonId, home_team_id: homeTeamId, away_team_id: awayTeamId, starts_at: match.utcDate, status, home_score: match.score?.fullTime?.home ?? null, away_score: match.score?.fullTime?.away ?? null, round_name: match.stage ?? match.group ?? (match.matchday ? `Matchday ${match.matchday}` : null), provider: PROVIDERS.FOOTBALL_DATA, provider_id: String(match.id) }, { onConflict: 'id' });
  if (error) throw new Error(`Unable to upsert live match ${match.id}: ${error.message}`);
}
async function ensureTeam(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, providerId: number, name: string, crest?: string | null) {
  const id = canonicalId('team', PROVIDERS.FOOTBALL_DATA, providerId);
  const { data, error } = await supabase.from('teams_v2').upsert({ id, sport_id: 'football', name, slug: canonicalSlug(name, providerId), team_type: 'CLUB', gender: 'MEN', age_group: 'SENIOR', crest_url: crest ?? null, provider: PROVIDERS.FOOTBALL_DATA, provider_id: String(providerId) }, { onConflict: 'id' }).select('id').single();
  if (error) throw new Error(`Unable to upsert team ${providerId}: ${error.message}`);
  return data?.id ?? null;
}
function dedupe(matches: FootballDataMatch[]) { return [...new Map(matches.map((match) => [match.id, match])).values()]; }
