import { getSupabaseServerClient } from '@/lib/supabase';
import { cacheGet, cacheSet } from '@/lib/cache';
import { listMatches, type FootballDataMatch } from '@/lib/providers/football-data';

const PROVIDER = 'football-data.org';
const LIVE_CACHE_KEY = 'ultrawear:football:live:v1';
const idFor = (prefix: string, providerId: string | number) => `${prefix}_${PROVIDER.replace(/[^a-z0-9]/gi, '')}_${providerId}`;
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
export type LiveEvent = { id: string; starts_at: string; status: string; home_score: number | null; away_score: number | null; competition: string; home_team: { name: string; crest_url: string | null }; away_team: { name: string; crest_url: string | null } };
const LIVE_STATUSES = ['IN_PLAY', 'PAUSED'];

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
  const { matches: inPlay } = await listMatches({ status: 'IN_PLAY' });
  const { matches: paused } = await listMatches({ status: 'PAUSED' });
  const matches = dedupe([...inPlay, ...paused]);
  for (const match of matches) await upsertLiveMatch(supabase, match);
  await supabase.from('events_v2').update({ status: 'FINISHED', updated_at: new Date().toISOString() }).in('status', LIVE_STATUSES).lt('starts_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString());
  const events = await readLiveEvents(supabase);
  await cacheSet(LIVE_CACHE_KEY, events, 90);
  return { live: events.length, updated: matches.length, cached: true };
}

export async function getLiveEvents(): Promise<LiveEvent[]> {
  const cached = await cacheGet<LiveEvent[]>(LIVE_CACHE_KEY);
  if (cached) return cached;
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  return readLiveEvents(supabase);
}

async function readLiveEvents(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>): Promise<LiveEvent[]> {
  const { data, error } = await supabase.from('events_v2')
    .select('id,starts_at,status,home_score,away_score,competition:competitions_v2(name),home_team:teams_v2!events_v2_home_team_id_fkey(name,crest_url),away_team:teams_v2!events_v2_away_team_id_fkey(name,crest_url)')
    .in('status', LIVE_STATUSES).order('starts_at', { ascending: true });
  if (error || !data) return [];
  return (data as unknown as LiveRow[]).map((row) => ({
    id: row.id, starts_at: row.starts_at, status: row.status, home_score: row.home_score, away_score: row.away_score,
    competition: Array.isArray(row.competition) ? row.competition[0]?.name ?? 'Football' : row.competition?.name ?? 'Football',
    home_team: Array.isArray(row.home_team) ? row.home_team[0] ?? { name: 'Home', crest_url: null } : row.home_team ?? { name: 'Home', crest_url: null },
    away_team: Array.isArray(row.away_team) ? row.away_team[0] ?? { name: 'Away', crest_url: null } : row.away_team ?? { name: 'Away', crest_url: null },
  }));
}

async function upsertLiveMatch(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, match: FootballDataMatch) {
  const competitionId = idFor('competition', match.competition.id);
  const seasonId = idFor('season', match.season.id);
  const homeTeamId = await ensureTeam(supabase, match.homeTeam.id, match.homeTeam.name, match.homeTeam.crest);
  const awayTeamId = await ensureTeam(supabase, match.awayTeam.id, match.awayTeam.name, match.awayTeam.crest);
  await supabase.from('events_v2').upsert({ id: idFor('event', match.id), sport_id: 'football', competition_id: competitionId, season_id: seasonId, home_team_id: homeTeamId, away_team_id: awayTeamId, starts_at: match.utcDate, status: match.status, home_score: match.score?.fullTime?.home ?? null, away_score: match.score?.fullTime?.away ?? null, round_name: match.stage ?? match.group ?? (match.matchday ? `Matchday ${match.matchday}` : null), provider: PROVIDER, provider_id: String(match.id) }, { onConflict: 'id' });
}
async function ensureTeam(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, providerId: number, name: string, crest?: string | null) {
  const id = idFor('team', providerId);
  const { data } = await supabase.from('teams_v2').upsert({ id, sport_id: 'football', name, slug: slugify(`${name}-${providerId}`), team_type: 'CLUB', gender: 'MEN', age_group: 'SENIOR', crest_url: crest ?? null, provider: PROVIDER, provider_id: String(providerId) }, { onConflict: 'id' }).select('id').single();
  return data?.id ?? null;
}
function dedupe(matches: FootballDataMatch[]) { return [...new Map(matches.map((match) => [match.id, match])).values()]; }
