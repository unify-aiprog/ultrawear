import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase';

export const revalidate = 60;
type Props = { params: Promise<{ id: string }> };
async function getMatch(id: string) {
  const supabase = getSupabaseServerClient(); if (!supabase) return null;
  const { data } = await supabase.from('events_v2').select('id,starts_at,status,home_score,away_score,round_name,competitions_v2(id,name,slug),home_team:teams_v2!events_v2_home_team_id_fkey(id,name,slug,crest_url),away_team:teams_v2!events_v2_away_team_id_fkey(id,name,slug,crest_url)').eq('id', id).maybeSingle();
  return data as any;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { id } = await params; const match = await getMatch(id); return { title: match ? `${match.home_team?.name ?? 'Home'} vs ${match.away_team?.name ?? 'Away'}` : 'Match' }; }
export default async function MatchPage({ params }: Props) { const { id } = await params; const match = await getMatch(id); if (!match) notFound(); return <div className="page-wrap"><section className="match-hero"><p className="eyebrow">MATCH CENTRE · {match.competitions_v2?.name ?? 'Football'}</p><div className="match-score"><Link href={`/teams/${match.home_team?.slug}`}>{match.home_team?.name ?? 'Home'}</Link><strong>{match.home_score ?? '—'} <span>–</span> {match.away_score ?? '—'}</strong><Link href={`/teams/${match.away_team?.slug}`}>{match.away_team?.name ?? 'Away'}</Link></div><p>{match.starts_at ? new Date(match.starts_at).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' }) : 'Time TBC'} · {match.status ?? 'Scheduled'}{match.round_name ? ` · ${match.round_name}` : ''}</p></section><section className="detail-section"><div className="section-heading"><span>01</span><h2>MATCH INFO.</h2></div><div className="profile-grid"><div className="profile-card"><span>COMPETITION</span><strong>{match.competitions_v2?.name ?? '—'}</strong></div><div className="profile-card"><span>STATUS</span><strong>{match.status ?? '—'}</strong></div><div className="profile-card"><span>KICKOFF</span><strong>{match.starts_at ? new Date(match.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBC'}</strong></div></div></section></div>; }
