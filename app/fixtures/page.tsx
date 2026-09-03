import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/supabase';

export const revalidate = 120;

async function getFixtures() {
  const supabase = getSupabaseServerClient(); if (!supabase) return [];
  const { data } = await supabase.from('events_v2').select('id,starts_at,status,home_score,away_score,round_name,competitions_v2(id,name,slug),home_team:teams_v2!events_v2_home_team_id_fkey(id,name,slug),away_team:teams_v2!events_v2_away_team_id_fkey(id,name,slug)').order('starts_at', { ascending: false }).limit(100);
  return (data ?? []) as any[];
}

export default async function FixturesPage() {
  const fixtures = await getFixtures();
  return <div className="page-wrap"><section className="page-hero"><p className="eyebrow">MATCHDAY INDEX</p><h1>Fixtures<br /><em>& results.</em></h1><p>One global match list, powered by the same event graph used by team and competition pages.</p></section><section className="section-block"><div className="data-list">{fixtures.map((event) => <Link className="data-row" href={`/matches/${event.id}`} key={event.id}><span>{event.starts_at ? new Date(event.starts_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}</span><b>{event.home_team?.name ?? 'Home'} <strong>{event.home_score ?? '—'}–{event.away_score ?? '—'}</strong> {event.away_team?.name ?? 'Away'}</b><small>{event.competitions_v2?.name ?? 'Football'} · {event.status ?? 'Scheduled'}</small></Link>)}{!fixtures.length && <div className="empty-state"><strong>No fixtures are available yet.</strong><span>Run the football catalogue sync to populate upcoming matches and results.</span></div>}</div></section></div>;
}
