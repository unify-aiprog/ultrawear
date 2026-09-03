import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogueTeam, getTeamCompetitions, getTeamEvents, getTeamPeople } from '@/lib/catalogue';

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const team = await getCatalogueTeam(slug); return { title: team?.name || 'Team' }; }

export default async function TeamPage({ params }: Props) {
  const { slug } = await params; const team = await getCatalogueTeam(slug); if (!team) notFound();
  const [competitions, people, events] = await Promise.all([getTeamCompetitions(team.id), getTeamPeople(team.id), getTeamEvents(team.id)]);
  return <div className="page-wrap"><section className="page-hero"><p className="eyebrow">TEAM PROFILE · {team.team_type}</p><h1>{team.name}</h1><p>{team.age_group} · {team.gender} · {team.level ?? 'Global competition'}</p></section>
    <section className="profile-grid"><div className="profile-card"><span>SPORT</span><strong>{team.sport_id}</strong></div><div className="profile-card"><span>TYPE</span><strong>{team.team_type}</strong></div><div className="profile-card"><span>GENDER</span><strong>{team.gender}</strong></div><div className="profile-card"><span>AGE</span><strong>{team.age_group}</strong></div></section>
    <section className="detail-section"><div className="section-heading"><span>01</span><h2>COMPETITIONS.</h2></div><div className="index-grid">{competitions.slice(0, 30).map((row: any) => <Link className="index-card" href={`/competitions/${row.competitions_v2?.slug}`} key={`${row.competition_id}-${row.season_id}`}><span>{row.seasons?.name ?? 'Season'}</span><b>{row.competitions_v2?.name ?? 'Competition'}</b><small>Competition profile →</small></Link>)}{!competitions.length && <div className="empty-state">Competition memberships will appear after catalogue ingestion.</div>}</div></section>
    <section className="detail-section"><div className="section-heading"><span>02</span><h2>SQUAD.</h2></div><div className="index-grid">{people.slice(0, 60).map((row: any) => <Link className="index-card" href={`/players/${row.persons_v2?.slug}`} key={`${row.person_id}-${row.role}`}><span>{row.role}{row.position ? ` · ${row.position}` : ''}</span><b>{row.persons_v2?.name}</b><small>{row.shirt_number ? `#${row.shirt_number}` : 'Player profile →'}</small></Link>)}{!people.length && <div className="empty-state">Squad data will populate when player memberships are ingested.</div>}</div></section>
    <section className="detail-section"><div className="section-heading"><span>03</span><h2>MATCHES.</h2></div><div className="data-list">{events.map((event) => <Link className="data-row" href={`/matches/${event.id}`} key={event.id}><span>{event.starts_at ? new Date(event.starts_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : 'TBD'}</span><b>{event.home_team?.name ?? 'Home'} <strong>{event.home_score ?? '—'}–{event.away_score ?? '—'}</strong> {event.away_team?.name ?? 'Away'}</b><small>{event.status ?? 'Scheduled'}</small></Link>)}{!events.length && <div className="empty-state">No matches have been ingested for this team yet.</div>}</div></section>
  </div>;
}
