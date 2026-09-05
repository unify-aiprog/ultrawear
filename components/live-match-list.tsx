'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProgrammeEvent, SportsProgramme } from '@/lib/sports/programme';
import { articles } from '@/lib/editorial';

const articleImage = (slug: string) => slug === 'the-game-is-bigger-than-the-score' ? '/assets/news-community.svg' : slug === 'built-by-fans-made-for-everyone' ? '/assets/news-matchday.svg' : '/assets/news-sport-world.svg';

type LivePayload = { programme?: SportsProgramme | null; feedError?: boolean; updatedAt?: string | null; persisted?: boolean };

export function LiveMatchList({ initialProgramme }: { initialProgramme: SportsProgramme }) {
  const [programme, setProgramme] = useState(initialProgramme);
  const [feedUnavailable, setFeedUnavailable] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/live?refresh=${Date.now()}`, { cache: 'no-store', headers: { accept: 'application/json', 'cache-control': 'no-cache' } });
        const payload = await response.json() as LivePayload;
        if (!response.ok || !payload.programme) throw new Error('programme unavailable');
        if (active) {
          setProgramme(payload.programme);
          setFeedUnavailable(Boolean(payload.feedError));
          setLastUpdated(payload.updatedAt ?? null);
        }
      } catch {
        if (active) setFeedUnavailable(true);
      }
    };
    const interval = window.setInterval(refresh, 30_000);
    refresh();
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const hasProgramme = programme.now.length || programme.next.length || programme.tonight.length || programme.tomorrow.length || programme.thisWeekend.length || programme.recent.length;

  return (
    <div className="live-programme" aria-live="polite">
      {feedUnavailable && <p className="live-refresh-note" role="status">The latest trusted programme could not be refreshed. No unverified scores, fixtures or statuses are being substituted.</p>}
      {lastUpdated && <p className="live-refresh-note">LAST VERIFIED PROGRAMME UPDATE · {formatUpdatedAt(lastUpdated)}</p>}
      {programme.lead && (
        <section className="detail-section" aria-labelledby="lead-title">
          <div className="section-heading"><span>{programme.lead.priority === 'BLOCKBUSTER' ? 'THE BIG ONE' : programme.lead.window === 'NOW' ? 'LIVE NOW' : 'WHAT’S NEXT'}</span><h2 id="lead-title">{eventTitle(programme.lead)}</h2></div>
          <article className="live-card">
            <div className="live-card__meta"><span className="live-badge">{programme.lead.priority}</span><span>{programme.lead.sport}</span><span>{programme.lead.competition}</span></div>
            <div className="live-card__teams"><div><span>{participantName(programme.lead, 'home')}</span><strong>{programme.lead.window === 'NOW' ? score(programme.lead.homeScore) : startLabel(programme.lead)}</strong></div><div><span>{participantName(programme.lead, 'away')}</span><strong>{programme.lead.window === 'NOW' ? score(programme.lead.awayScore) : countdown(programme.lead.minutesUntilStart)}</strong></div></div>
          </article>
        </section>
      )}
      <ProgrammeSection title="LIVE NOW." eyebrow="NOW" events={programme.now} live />
      <ProgrammeSection title="COMING UP." eyebrow="NEXT" events={programme.next} />
      <ProgrammeSection title="TONIGHT." eyebrow="TONIGHT" events={programme.tonight} />
      <ProgrammeSection title="TOMORROW." eyebrow="TOMORROW" events={programme.tomorrow} />
      <ProgrammeSection title="THIS WEEKEND." eyebrow="THIS WEEKEND" events={programme.thisWeekend} />
      <ProgrammeSection title="RECENT." eyebrow="AFTER THE WHISTLE" events={programme.recent} recent />

      {!hasProgramme && (
        <section className="live-empty-with-news">
          <div className="empty-state"><strong>THE PROGRAMME IS ON.</strong><span>No verified event is available in the current programme window. We will promote the next trusted event automatically.</span></div>
          <section className="detail-section" aria-labelledby="latest-news-title">
            <div className="section-heading"><span>THE CULTURE</span><h2 id="latest-news-title">LATEST.</h2></div>
            <div className="index-grid">{articles.slice(0, 3).map((article) => <Link className="index-card" href={`/news/${article.slug}`} key={article.slug}><div aria-hidden="true" style={{ height: 180, marginBottom: 18, backgroundImage: `url(${articleImage(article.slug)})`, backgroundPosition: 'center', backgroundSize: 'cover', border: '1px solid var(--line)' }} /><span>{article.category} · {article.date}</span><b>{article.title}</b><small>{article.dek}</small></Link>)}</div>
          </section>
        </section>
      )}
    </div>
  );
}

function ProgrammeSection({ title, eyebrow, events, live = false, recent = false }: { title: string; eyebrow: string; events: ProgrammeEvent[]; live?: boolean; recent?: boolean }) {
  if (!events.length) return null;
  return <section className="detail-section" aria-label={eyebrow}><div className="section-heading"><span>{eyebrow}</span><h2>{title}</h2></div><div className="live-list">{events.map((event) => <MatchCard event={event} live={live} recent={recent} key={event.id} />)}</div></section>;
}

function MatchCard({ event, live, recent }: { event: ProgrammeEvent; live?: boolean; recent?: boolean }) {
  const primary = event.home && event.away ? `${event.home.name} v ${event.away.name}` : event.competition;
  const secondary = live ? (event.status === 'PAUSED' ? 'HALF-TIME' : 'IN PLAY') : recent ? 'FINAL' : countdown(event.minutesUntilStart);
  const scores = live || recent ? `${score(event.homeScore)} — ${score(event.awayScore)}` : secondary;
  return <article className="live-card"><div className="live-card__meta"><span className="live-badge">{recent ? 'FINAL' : live ? 'LIVE' : event.priority}</span><span>{event.sport}</span><span>{event.competition}</span></div><div className="live-card__teams"><div><span>{primary}</span><strong>{scores}</strong></div><div><span>{event.stage ?? event.status}</span><strong>{live ? secondary : event.window === 'RECENT' ? 'RESULT' : startLabel(event)}</strong></div></div></article>;
}

function participantName(event: ProgrammeEvent, side: 'home' | 'away') { return event[side]?.name ?? event.competition; }
function eventTitle(event: ProgrammeEvent) { return event.home && event.away ? `${event.home.name} v ${event.away.name}` : event.competition; }
function score(value?: number | null) { return value == null ? '—' : String(value); }
function startLabel(event: ProgrammeEvent) { return event.minutesUntilStart === undefined ? 'TBC' : countdown(event.minutesUntilStart); }
function countdown(minutes?: number) {
  if (minutes === undefined) return 'TBC';
  if (minutes <= 0) return 'STARTS NOW';
  if (minutes < 60) return `IN ${minutes}M`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `IN ${hours}H ${remaining}M` : `IN ${hours}H`;
}
function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'UNKNOWN' : date.toLocaleString();
}
