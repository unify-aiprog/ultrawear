import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogueCompetition, getCompetitionEvents, getCompetitionSeasons, getCompetitionTeams, getStandings } from '@/lib/catalogue';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCatalogueCompetition(slug);
  return { title: competition?.name || 'Competition' };
}

export default async function CompetitionPage({ params }: Props) {
  const { slug } = await params;
  const competition = await getCatalogueCompetition(slug);
  if (!competition) notFound();
  const [seasons, teams, events, standings] = await Promise.all([getCompetitionSeasons(competition.id), getCompetitionTeams(competition.id), getCompetitionEvents(competition.id), getStandings(competition.id)]);
  return <div className="page-wrap">
    <section className="page-hero"><p className="eyebrow">COMPETITION · {competition.competition_type}</p><h1>{competition.name}</h1><p>Teams, fixtures, results and standings in one matchday hub.</p></section>
    <section className="detail-grid"><div className="detail-main"><div className="section-heading"><span>01</span><h2>FIXTURES <em>& RESULTS.</em></h2></div><div className="data-list">{events.map((event) => <Link className="data-row" href={`/matches/${event.id}`} key={event.id}><span>{event.starts_at ? new Date(event.starts_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : 'TBD'}</span><b>{event.home_team?.name ?? 'Home'} <strong>{event.home_score ?? '—'}–{event.away_score ?? '—'}</strong> {event.away_team?.name ?? 'Away'}</b><small>{event.status ?? 'Scheduled'}</small></Link>)}{!events.length && <div className="empty-state">No fixtures or results have been ingested yet.</div>}</div></div><aside className="detail-side"><div className="side-card"><span>SEASON</span><b>{seasons.find((season) => season.current)?.name ?? seasons[0]?.name ?? 'Current season'}</b>{seasons.slice(0, 5).map((season) => <small key={season.id}>{season.name}</small>)}</div><div className="side-card"><span>TEAMS</span><b>{teams.length}</b><Link className="text-link" href={`/teams?competition=${competition.id}`}>View team index →</Link></div></aside></section>
    <section className="section-block detail-section"><div className="section-heading"><span>02</span><h2>STANDINGS.</h2></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Team</th><th>P</th><th>GD</th><th>Pts</th></tr></thead><tbody>{standings.map((row: any) => <tr key={row.teams_v2?.id ?? row.position}><td>{row.position}</td><td><Link href={`/teams/${row.teams_v2?.slug}`}>{row.teams_v2?.name ?? 'Team'}</Link></td><td>{row.played ?? '—'}</td><td>{row.goal_difference ?? '—'}</td><td><b>{row.points ?? '—'}</b></td></tr>)}</tbody></table>{!standings.length && <div className="empty-state">Standings will appear after the competition feed is synced.</div>}</div></section>
    <section className="detail-section"><div className="section-heading"><span>03</span><h2>TEAMS.</h2></div><div className="index-grid">{teams.slice(0, 60).map((row: any) => <Link className="index-card" href={`/teams/${row.teams_v2?.slug}`} key={`${row.team_id}-${row.season_id}`}><span>{row.teams_v2?.age_group} · {row.teams_v2?.gender}</span><b>{row.teams_v2?.name}</b><small>{row.teams_v2?.short_name ?? 'Competition participant'}</small></Link>)}</div></section>
  </div>;
}
