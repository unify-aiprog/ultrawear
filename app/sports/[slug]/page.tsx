import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WeekendAction, getWeekendActionEvents } from '@/components/weekend-action';
import { getCatalogueCompetitions, getCatalogueTeams, getSport } from '@/lib/catalogue';
import { getSportProgramme } from '@/lib/sports/engine';
import type { ProgrammeEvent } from '@/lib/sports/programme';

export const revalidate = 120;

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sport = await getSport(slug);
  if (!sport) notFound();

  const [competitions, teams, weekendEvents, programme] = await Promise.all([
    getCatalogueCompetitions({ sportId: sport.id }),
    getCatalogueTeams({ sportId: sport.id }),
    getWeekendActionEvents(sport.id),
    getSportProgramme(slug),
  ]);

  return (
    <section className="section">
      <p className="eyebrow">SPORT PROGRAMME · NOW → NEXT → TONIGHT → TOMORROW → THIS WEEKEND</p>
      <h1 className="page-title">{sport.name.toUpperCase()}<br /><em>WORLD.</em></h1>
      <p className="lede dark">{programme.editorial.body}</p>
      {programme.lead && <LeadEvent event={programme.lead} />}
      <ProgrammeSection label="NOW" title="LIVE." events={programme.now} />
      <ProgrammeSection label="NEXT" title="COMING UP." events={programme.next} />
      <ProgrammeSection label="TONIGHT" title="TONIGHT." events={programme.tonight} />
      <ProgrammeSection label="TOMORROW" title="TOMORROW." events={programme.tomorrow} />
      <ProgrammeSection label="THIS WEEKEND" title="THE WEEKEND." events={programme.thisWeekend} />
      <ProgrammeSection label="RECENT" title="RELIVE IT." events={programme.recent} />
      <WeekendAction events={weekendEvents} title={`${sport.name.toUpperCase()} ACTION.`} />
      <div className="catalogue-section"><div className="section-heading"><span>01</span><h2>COMPETITIONS</h2></div><div className="index-grid">{competitions.slice(0, 100).map((competition) => <Link className="index-card" href={`/competitions/${competition.slug}`} key={competition.id}><span>{competition.competition_type}</span><b>{competition.name}</b><small>{competition.gender} · {competition.age_group}</small></Link>)}</div>{competitions.length === 0 && <div className="empty-state">No competitions have been ingested yet.</div>}</div>
      <div className="catalogue-section"><div className="section-heading"><span>02</span><h2>TEAMS</h2></div><div className="index-grid">{teams.slice(0, 100).map((team) => <Link className="index-card" href={`/teams/${team.slug}`} key={team.id}><span>{team.team_type}</span><b>{team.name}</b><small>{team.gender} · {team.age_group}</small></Link>)}</div>{teams.length === 0 && <div className="empty-state">No teams have been ingested yet.</div>}</div>
    </section>
  );
}

function LeadEvent({ event }: { event: ProgrammeEvent }) {
  return <section className="detail-section"><div className="section-heading"><span>{event.priority}</span><h2>{event.priority === 'BLOCKBUSTER' ? 'THE BIG ONE.' : event.priority === 'LIVE' ? 'LIVE NOW.' : 'WHAT’S NEXT.'}</h2></div><div className="live-card"><div className="live-card__meta"><span className="live-badge">{event.priority}</span><span>{event.competition}</span></div><div className="live-card__teams"><div><span>{event.home?.name ?? event.competition}</span><strong>{formatScore(event.homeScore)}</strong></div><div><span>{event.away?.name ?? event.stage ?? 'Programme'}</span><strong>{event.away ? formatScore(event.awayScore) : formatCountdown(event.minutesUntilStart)}</strong></div></div></div></section>;
}

function ProgrammeSection({ label, title, events }: { label: string; title: string; events: ProgrammeEvent[] }) {
  if (!events.length) return null;
  return <section className="detail-section"><div className="section-heading"><span>{label}</span><h2>{title}</h2></div><div className="index-grid">{events.map((event) => <div className="index-card" key={event.id}><span>{event.priority} · {event.competition}</span><b>{event.home?.name ?? event.competition}{event.away ? ` v ${event.away.name}` : ''}{event.status === 'IN_PLAY' || event.status === 'PAUSED' ? ` · ${formatScore(event.homeScore)} — ${formatScore(event.awayScore)}` : ''}</b><small>{event.status === 'IN_PLAY' || event.status === 'PAUSED' ? `Live · ${event.provider}` : event.minutesUntilStart !== undefined ? `Starts in ${Math.max(0, event.minutesUntilStart)} minutes.` : event.status === 'FINISHED' ? `Final · ${event.provider}` : 'Start time TBC.'}</small></div>)}</div></section>;
}

function formatScore(score: number | null | undefined) {
  return score === null || score === undefined ? '—' : String(score);
}

function formatCountdown(minutes: number | undefined) {
  return minutes === undefined ? 'TBC' : `IN ${Math.max(0, minutes)}M`;
}
