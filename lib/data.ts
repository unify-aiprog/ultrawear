import { cacheGet, cacheSet } from '@/lib/cache';
import { getSupabaseServerClient } from '@/lib/supabase';

export type Sport = { id: string; name: string; slug: string; description: string | null };
export type Country = { id: string; name: string; slug: string; code: string | null };
export type Competition = {
  id: string; name: string; slug: string; sport: string; sport_id: string | null;
  country: string | null; country_id: string | null; level: string | null;
  gender: string; age_group: string; competition_type: string; emblem_url: string | null;
};
export type Organization = { id: string; name: string; slug: string; country: string | null; crest_url: string | null; organization_type: string };
export type Team = {
  id: string; name: string; slug: string; crest_url: string | null; organization_id: string | null;
  country: string | null; team_type: string; gender: string; age_group: string; parent_team_id: string | null;
};
export type Person = { id: string; name: string; slug: string; image_url: string | null; position: string | null; nationality: string | null };

function client() { return getSupabaseServerClient(); }

async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await load();
  if (value !== null && value !== undefined) await cacheSet(key, value as never, ttlSeconds);
  return value;
}

export async function getSports(): Promise<Sport[]> {
  return cached('ultrawear:data:sports:v1', 900, async () => {
    const supabase = client(); if (!supabase) return [];
    const { data } = await supabase.from('sports').select('id,name,slug,description').order('name'); return data ?? [];
  });
}

export async function getCountries(): Promise<Country[]> {
  return cached('ultrawear:data:countries:v1', 900, async () => {
    const supabase = client(); if (!supabase) return [];
    const { data } = await supabase.from('countries').select('id,name,slug,code').order('name'); return data ?? [];
  });
}

export async function getCompetitions(filters?: { sport?: string; countryId?: string; ageGroup?: string; gender?: string }): Promise<Competition[]> {
  const key = `ultrawear:data:competitions:v1:${filters?.sport ?? ''}:${filters?.countryId ?? ''}:${filters?.ageGroup ?? ''}:${filters?.gender ?? ''}`;
  return cached(key, 600, async () => {
    const supabase = client(); if (!supabase) return [];
    let query = supabase.from('competitions').select('id,name,slug,sport,sport_id,country,country_id,level,gender,age_group,competition_type,emblem_url').order('name');
    if (filters?.sport) query = query.eq('sport', filters.sport);
    if (filters?.countryId) query = query.eq('country_id', filters.countryId);
    if (filters?.ageGroup) query = query.eq('age_group', filters.ageGroup);
    if (filters?.gender) query = query.eq('gender', filters.gender);
    const { data } = await query; return data ?? [];
  });
}

export async function getCompetition(slug: string) {
  return cached(`ultrawear:data:competition:v1:${slug}`, 600, async () => {
    const supabase = client(); if (!supabase) return null;
    const { data } = await supabase.from('competitions').select('*').eq('slug', slug).maybeSingle(); return data;
  });
}

export async function getOrganizations(filters?: { sportId?: string; countryId?: string }): Promise<Organization[]> {
  const key = `ultrawear:data:organizations:v1:${filters?.sportId ?? ''}:${filters?.countryId ?? ''}`;
  return cached(key, 600, async () => {
    const supabase = client(); if (!supabase) return [];
    let query = supabase.from('organizations').select('id,name,slug,country,crest_url,organization_type').order('name');
    if (filters?.sportId) query = query.eq('sport_id', filters.sportId);
    if (filters?.countryId) query = query.eq('country_id', filters.countryId);
    const { data } = await query; return data ?? [];
  });
}

export async function getTeams(filters?: { sportId?: string; countryId?: string; ageGroup?: string; gender?: string; organizationId?: string }): Promise<Team[]> {
  const key = `ultrawear:data:teams:v1:${filters?.sportId ?? ''}:${filters?.countryId ?? ''}:${filters?.ageGroup ?? ''}:${filters?.gender ?? ''}:${filters?.organizationId ?? ''}`;
  return cached(key, 600, async () => {
    const supabase = client(); if (!supabase) return [];
    let query = supabase.from('teams').select('id,name,slug,crest_url,organization_id,country,team_type,gender,age_group,parent_team_id').order('name');
    if (filters?.sportId) query = query.eq('sport_id', filters.sportId);
    if (filters?.countryId) query = query.eq('country_id', filters.countryId);
    if (filters?.ageGroup) query = query.eq('age_group', filters.ageGroup);
    if (filters?.gender) query = query.eq('gender', filters.gender);
    if (filters?.organizationId) query = query.eq('organization_id', filters.organizationId);
    const { data } = await query; return data ?? [];
  });
}

export async function getTeam(slug: string) {
  return cached(`ultrawear:data:team:v1:${slug}`, 600, async () => {
    const supabase = client(); if (!supabase) return null;
    const { data } = await supabase.from('teams').select('*').eq('slug', slug).maybeSingle(); return data;
  });
}

export async function getPerson(slug: string) {
  return cached(`ultrawear:data:person:v1:${slug}`, 600, async () => {
    const supabase = client(); if (!supabase) return null;
    const { data } = await supabase.from('persons').select('*').eq('slug', slug).maybeSingle(); return data;
  });
}
