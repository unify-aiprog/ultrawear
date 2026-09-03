import { getSupabaseServerClient } from '@/lib/supabase';

export type Competition = { id: string; name: string; slug: string; sport: string; country: string | null };
export type Team = { id: string; name: string; slug: string; crest_url: string | null; competition_id: string | null };
export type Person = { id: string; name: string; slug: string; image_url: string | null; position: string | null; nationality: string | null };

export async function getCompetitions(): Promise<Competition[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from('competitions').select('id,name,slug,sport,country').order('name');
  return data ?? [];
}

export async function getCompetition(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from('competitions').select('*').eq('slug', slug).maybeSingle();
  return data;
}

export async function getTeams(competitionId?: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase.from('teams').select('*').order('name');
  if (competitionId) query = query.eq('competition_id', competitionId);
  const { data } = await query;
  return data ?? [];
}

export async function getTeam(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from('teams').select('*').eq('slug', slug).maybeSingle();
  return data;
}

export async function getPerson(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from('persons').select('*').eq('slug', slug).maybeSingle();
  return data;
}
