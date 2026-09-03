import { getSupabaseServerClient } from '@/lib/supabase';

export type Sport = { id: string; name: string; slug: string; description: string | null };
export type Country = { id: string; name: string; slug: string; code: string | null; flag_emoji: string | null };
export type CatalogueCompetition = { id: string; name: string; slug: string; sport_id: string; country_id: string | null; competition_type: string; gender: string; age_group: string; level: string | null; emblem_url: string | null };
export type CatalogueTeam = { id: string; name: string; short_name: string | null; slug: string; sport_id: string; organization_id: string | null; country_id: string | null; team_type: string; gender: string; age_group: string; level: string | null; crest_url: string | null };

export async function getSports(): Promise<Sport[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('sports').select('*').order('name');
  return data ?? [];
}

export async function getCountries(): Promise<Country[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('countries').select('*').order('name');
  return data ?? [];
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

export async function getCatalogueTeam(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from('teams_v2').select('*').eq('slug', slug).maybeSingle();
  return data;
}
