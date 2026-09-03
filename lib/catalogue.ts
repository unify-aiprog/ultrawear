import { getSupabaseServerClient } from '@/lib/supabase';

export type Sport = { id: string; name: string; slug: string; description: string | null };
export type Country = { id: string; name: string; slug: string; code: string | null; flag_emoji: string | null };
export type CatalogueCompetition = { id: string; name: string; slug: string; sport_id: string; country_id: string | null; competition_type: string; gender: string; age_group: string; level: string | null; emblem_url: string | null };
export type CatalogueTeam = { id: string; name: string; short_name: string | null; slug: string; sport_id: string; organization_id: string | null; country_id: string | null; team_type: string; gender: string; age_group: string; level: string | null; crest_url: string | null };
export type CatalogueEvent = { id: string; starts_at: string | null; status: string | null; home_score: number | null; away_score: number | null; round_name: string | null; competition: { id: string; name: string; slug: string } | null; home_team: { id: string; name: string; slug: string; crest_url: string | null } | null; away_team: { id: string; name: string; slug: string; crest_url: string | null } | null };

export async function getSports(): Promise<Sport[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('sports').select('*').order('name');
  return data ?? [];
}

export async function getSport(slug: string): Promise<Sport | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from('sports').select('*').eq('slug', slug).maybeSingle();
  return data;
}

export async function getCountries(): Promise<Country[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('countries').select('*').order('name');
  return data ?? [];
}

export async function getCountry(slug: string): Promise<Country | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from('countries').select('*').eq('slug', slug).maybeSingle();
  return data;
}

export async function getCatalogueCompetitions(filters?: { sportId?: string; countryId?: string }): Promise<CatalogueCompetition[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase.from('competitions_v2').select('*').order('name');
  if (filters?.sportId) query = query.eq('sport_id', filters.sportId);
  if (filters?.countryId) query = query.eq('country_id', filters.countryId);
  const { data } = await query;
  return data ?? [];
}

export async function getCatalogueCompetition(slug: string): Promise<CatalogueCompetition | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from('competitions_v2').select('*').eq('slug', slug).maybeSingle();
  return data;
}

export async function getCatalogueTeams(filters?: { sportId?: string; countryId?: string; organizationId?: string; ageGroup?: string }): Promise<CatalogueTeam[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase.from('teams_v2').select('*').order('name');
  if (filters?.sportId) query = query.eq('sport_id', filters.sportId);
  if (filters?.countryId) query = query.eq('country_id', filters.countryId);
  if (filters?.organizationId) query = query.eq('organization_id', filters.organizationId);
  if (filters?.ageGroup) query = query.eq('age_group', filters.ageGroup);
  const { data } = await query;
  return data ?? [];
}

export async function getCatalogueTeam(slug: string): Promise<CatalogueTeam | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from('teams_v2').select('*').eq('slug', slug).maybeSingle();
  return data;
}

export async function getTeamCompetitions(teamId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('team_competitions').select('competition_id, season_id, competitions_v2(id,name,slug), seasons(id,name,slug)').eq('team_id', teamId);
  return data ?? [];
}

export async function getCompetitionTeams(competitionId: string, seasonId?: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase.from('team_competitions').select('team_id, season_id, teams_v2(id,name,slug,short_name,crest_url,gender,age_group)').eq('competition_id', competitionId);
  if (seasonId) query = query.eq('season_id', seasonId);
  const { data } = await query.order('team_id');
  return data ?? [];
}

export async function getCompetitionSeasons(competitionId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('seasons').select('id,name,slug,start_date,end_date,current').eq('competition_id', competitionId).order('start_date', { ascending: false });
  return data ?? [];
}

export async function getCompetitionEvents(competitionId: string, limit = 30): Promise<CatalogueEvent[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('events_v2').select('id,starts_at,status,home_score,away_score,round_name,competitions_v2(id,name,slug),home_team:teams_v2!events_v2_home_team_id_fkey(id,name,slug,crest_url),away_team:teams_v2!events_v2_away_team_id_fkey(id,name,slug,crest_url)').eq('competition_id', competitionId).order('starts_at', { ascending: false }).limit(limit);
  return (data ?? []) as unknown as CatalogueEvent[];
}

export async function getTeamEvents(teamId: string, limit = 30): Promise<CatalogueEvent[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('events_v2').select('id,starts_at,status,home_score,away_score,round_name,competitions_v2(id,name,slug),home_team:teams_v2!events_v2_home_team_id_fkey(id,name,slug,crest_url),away_team:teams_v2!events_v2_away_team_id_fkey(id,name,slug,crest_url)').or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`).order('starts_at', { ascending: false }).limit(limit);
  return (data ?? []) as unknown as CatalogueEvent[];
}

export async function getTeamPeople(teamId: string, seasonId?: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase.from('team_memberships').select('person_id,role,shirt_number,position,persons_v2(id,name,slug,person_type,image_url,nationality_country_id)').eq('team_id', teamId);
  if (seasonId) query = query.eq('season_id', seasonId);
  const { data } = await query.order('role').order('person_id');
  return data ?? [];
}

export async function getStandings(competitionId: string, seasonId?: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase.from('competition_standings').select('position,played,won,drawn,lost,goals_for,goals_against,goal_difference,points,teams_v2(id,name,slug,crest_url)').eq('competition_id', competitionId).order('position');
  if (seasonId) query = query.eq('season_id', seasonId);
  const { data } = await query;
  return data ?? [];
}

export async function getPerson(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from('persons_v2').select('id,name,slug,person_type,image_url,birth_date,nationality_country_id,countries: nationality_country_id(id,name,slug,code,flag_emoji)').eq('slug', slug).maybeSingle();
  return data;
}

export async function getPersonTeams(personId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('team_memberships').select('role,shirt_number,position,season_id,seasons(id,name,slug),teams_v2(id,name,slug,crest_url)').eq('person_id', personId).order('season_id', { ascending: false });
  return data ?? [];
}

export async function getPersonEvents(personId: string, limit = 20) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('team_memberships').select('team_id').eq('person_id', personId);
  const teamIds = [...new Set((data ?? []).map((row) => row.team_id))];
  if (!teamIds.length) return [];
  const { data: events } = await supabase.from('events_v2').select('id,starts_at,status,home_score,away_score,round_name,competitions_v2(id,name,slug),home_team:teams_v2!events_v2_home_team_id_fkey(id,name,slug,crest_url),away_team:teams_v2!events_v2_away_team_id_fkey(id,name,slug,crest_url)').or(teamIds.map((id) => `home_team_id.eq.${id},away_team_id.eq.${id}`).join(',')).order('starts_at', { ascending: false }).limit(limit);
  return (events ?? []) as unknown as CatalogueEvent[];
}
