import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WeekendAction, getWeekendActionEvents } from '@/components/weekend-action';
import { getCatalogueCompetitions, getCatalogueTeams, getSport } from '@/lib/catalogue';

export const revalidate = 120;

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sport = await getSport(slug);
  if (!sport) notFound();
  const [competitions, teams, weekendEvents] = await Promise.all([
    getCatalogueCompetitions({ sportId: sport.id }),
    getCatalogueTeams({ sportId: sport.id }),
    getWeekendActionEvents(sport.id),
  ]);
  return (
    <section className="section">
      <p className="eyebrow">SPORT CATALOGUE · THIS WEEKEND</p>
      <h1 className="page-title">{sport.name.toUpperCase()}<br /><em>WORLD.</em></h1>
      <p className="lede dark">{sport.description ?? `Explore ${sport.name} competitions, teams and seasons.`}</p>
      <WeekendAction events={weekendEvents} title={`${sport.name.toUpperCase()} ACTION.`} />
      <div className="catalogue-section"><div className="section-heading"><span>01</span><h2>COMPETITIONS</h2></div><div className="index-grid">
        {competitions.slice(0, 100).map((competition) => <Link className="index-card" href={`/competitions/${competition.slug}`} key={competition.id}><span>{competition.competition_type}</span><b>{competition.name}</b><small>{competition.gender} · {competition.age_group}</small></Link>)}
      </div>{competitions.length === 0 && <div className="empty-state">No competitions have been ingested yet.</div>}</div>
      <div className="catalogue-section"><div className="section-heading"><span>02</span><h2>TEAMS</h2></div><div className="index-grid">
        {teams.slice(0, 100).map((team) => <Link className="index-card" href={`/teams/${team.slug}`} key={team.id}><span>{team.team_type}</span><b>{team.name}</b><small>{team.gender} · {team.age_group}</small></Link>)}
      </div>{teams.length === 0 && <div className="empty-state">No teams have been ingested yet.</div>}</div>
    </section>
  );
}
