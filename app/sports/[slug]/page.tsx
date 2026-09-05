import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WeekendAction, getWeekendActionEvents } from '@/components/weekend-action';
import { getCatalogueCompetitions, getCatalogueTeams, getSport } from '@/lib/catalogue';
import { getSportProgramme } from '@/lib/sports/engine';

export const revalidate = 120;

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sport = await getSport(slug);
  if (!sport) notFound();
  const [competitions, teams, weekendEvents, programme] = await Promise.all([
    getCatalogueCompetitions({ sportId: sport.id }), getCatalogueTeams({ sportId: sport.id }), getWeekendActionEvents(sport.id), getSportProgramme(slug),
  ]);
  return (
    <section className="section">
      <p className="eyebrow">SPORT PROGRAMME · NOW → NEXT → TONIGHT → TOMORROW</p>
      <h1 className="page-title">{sport.name.toUpperCase()}<br /><em>WORLD.</em></h1>
      <p className="lede dark">{programme.editorial.body}</p>
      {programme.lead && <section className="detail-section"><div className="section-heading"><span>{programme.editorial.kicker}</span><h2>{programme.editorial.headline}</h2></div><div className="live-card"><div className="live-card__meta"><span className="live-badge">{programme.lead.priority}</span><span>{programme.lead.competition}</span></div><div className="live-card__teams"><div><span>{programme.lead.home?.name ?? programme.lead.competition}</span><strong>{programme.lead.homeScore ?? '—'}</strong></div><div><span>{programme.lead.away?.name ?? programme.lead.stage ?? 'Programme'}</span><strong>{programme.lead.awayScore ?? (programme.lead.minutesUntilStart !== undefined ? `IN ${Math.max(0, programme.lead.minutesUntilStart)}M` : 'TBC')}</strong></div></div></div></section>}
      {programme.now.length > 0 && <section className="detail-section"><div className="section-heading"><span>NOW</span><h2>LIVE.</h2></div><div className="index-grid">{programme.now.map((event) => <div className="index-card" key={event.id}><span>{event.competition}</span><b>{event.home?.name ?? 'Event'} {event.homeScore ?? 0} — {event.awayScore ?? 0} {event.away?.name ?? ''}</b><small>Verified live state · {event.provider}</small></div>)}</div></section>}
      {programme.next.length > 0 && <section className="detail-section"><div className="section-heading"><span>NEXT</span><h2>COMING UP.</h2></div><div className="index-grid">{programme.next.map((event) => <div className="index-card" key={event.id}><span>{event.priority} · {event.competition}</span><b>{event.home?.name ?? event.competition} {event.away ? `v ${event.away.name}` : ''}</b><small>{event.minutesUntilStart !== undefined ? `Starts in ${Math.max(0, event.minutesUntilStart)} minutes.` : 'Start time TBC.'}</small></div>)}</div></section>}
      <WeekendAction events={weekendEvents} title={`${sport.name.toUpperCase()} ACTION.`} />
      <div className="catalogue-section"><div className="section-heading"><span>01</span><h2>COMPETITIONS</h2></div><div className="index-grid">{competitions.slice(0, 100).map((competition) => <Link className="index-card" href={`/competitions/${competition.slug}`} key={competition.id}><span>{competition.competition_type}</span><b>{competition.name}</b><small>{competition.gender} · {competition.age_group}</small></Link>)}</div>{competitions.length === 0 && <div className="empty-state">No competitions have been ingested yet.</div>}</div>
      <div className="catalogue-section"><div className="section-heading"><span>02</span><h2>TEAMS</h2></div><div className="index-grid">{teams.slice(0, 100).map((team) => <Link className="index-card" href={`/teams/${team.slug}`} key={team.id}><span>{team.team_type}</span><b>{team.name}</b><small>{team.gender} · {team.age_group}</small></Link>)}</div>{teams.length === 0 && <div className="empty-state">No teams have been ingested yet.</div>}</div>
    </section>
  );
}
