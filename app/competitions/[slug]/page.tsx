import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogueCompetition, getCompetitionEvents, getCompetitionSeasons, getCompetitionTeams, getStandings } from '@/lib/catalogue';

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCatalogueCompetition(slug);
  if (!competition) return { title: 'Competition' };
  return { title: competition.name, description: `${competition.name}: fixtures, results, standings, seasons and teams.` };
}

export default async function CompetitionPage({ params }: Props) {
  const { slug } = await params;
  const competition = await getCatalogueCompetition(slug);
  if (!competition) notFound();
  const [seasons, teams, events, standings] = await Promise.all([
    getCompetitionSeasons(competition.id), getCompetitionTeams(competition.id), getCompetitionEvents(competition.id, 50), getStandings(competition.id),
  ]);
  const currentSeason = seasons.find((season: any) => season.current) ?? seasons[0];
  const jsonLd = { '@context': 'https://schema.org', '@type': 'SportsOrganization', name: competition.name, sport: 'Football' };
  return <div className="page-wrap">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <section className="page-hero"><p className="eyebrow">COMPETITION · {competition.competition_type}</p><h1>{competition.name}</h1><p>{competition.gender} · {competition.age_group}{competition.level ? ` · Level ${competition.level}` : ''}. Fixtures, results, standings and teams in one matchday hub.</p></section>
    <section className="detail-grid"><div className="detail-main"><div className="section-heading"><span>01</span><h2>FIXTURES <em>& RESULTS.</em></h2></div><div className="data-list">{events.map((event) => <Link className="data-row" href={`/matches/${event.id}`} key={event.id}><span>{event.starts_at ? new Date(event.starts_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : 'TBD'}</span><b><span>{event.home_team?.name ?? 'Home'}</span><strong>{event.home_score ?? '—'}–{event.away_score ?? '—'}</strong><span>{event.away_team?.name ?? 'Away'}</span></b><small>{event.status ?? 'Scheduled'}</small></Link>)}{!events.length && <div className="empty-state"><strong>No fixtures yet.</strong><span>This competition has not received event data yet.</span></div>}</div></div><aside className="detail-side"><div className="side-card"><span>SEASON</span><b>{currentSeason?.name ?? 'Current season'}</b>{seasons.slice(0, 5).map((season: any) => <small key={season.id}>{season.name}</small>)}</div><div className="side-card"><span>TEAMS</span><b>{teams.length}</b><Link className="text-link" href={`/teams?competition=${competition.id}`}>View team index →</Link></div></aside></section>
    <section className="detail-section"><div className="section-heading"><span>02</span><h2>STANDINGS.</h2></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>{standings.map((row: any) => <tr key={row.teams_v2?.id ?? row.position}><td>{row.position}</td><td><Link href={`/teams/${row.teams_v2?.slug}`}>{row.teams_v2?.name ?? 'Team'}</Link></td><td>{row.played ?? '—'}</td><td>{row.won ?? '—'}</td><td>{row.drawn ?? '—'}</td><td>{row.lost ?? '—'}</td><td>{row.goal_difference ?? '—'}</td><td><b>{row.points ?? '—'}</b></td></tr>)}</tbody></table>{!standings.length && <div className="empty-state">Standings will appear after the competition feed is synced.</div>}</div></section>
    <section className="detail-section"><div className="section-heading"><span>03</span><h2>TEAMS.</h2></div><div className="index-grid">{teams.slice(0, 100).map((row: any) => <Link className="index-card" href={`/teams/${row.teams_v2?.slug}`} key={`${row.team_id}-${row.season_id}`}><span>{row.teams_v2?.age_group} · {row.teams_v2?.gender}</span><b>{row.teams_v2?.name}</b><small>{row.teams_v2?.short_name ?? 'Competition participant'}</small></Link>)}</div></section>
  </div>;
}
