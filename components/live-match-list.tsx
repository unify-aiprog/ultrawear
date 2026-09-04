'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SportsProgramme, BrainEvent } from '@/lib/sports-brain';
import { articles } from '@/lib/editorial';

const articleImage = (slug: string) => slug === 'the-game-is-bigger-than-the-score' ? '/assets/news-community.svg' : slug === 'built-by-fans-made-for-everyone' ? '/assets/news-matchday.svg' : '/assets/news-sport-world.svg';

export function LiveMatchList({ initialProgramme }: { initialProgramme: SportsProgramme }) {
  const [programme, setProgramme] = useState(initialProgramme);
  const [feedUnavailable, setFeedUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/live?refresh=${Date.now()}`, { cache: 'no-store', headers: { accept: 'application/json', 'cache-control': 'no-cache' } });
        if (!response.ok) throw new Error('feed unavailable');
        const payload = await response.json() as { programme?: SportsProgramme; feedError?: boolean };
        if (active && payload.programme) {
          setProgramme(payload.programme);
          setFeedUnavailable(Boolean(payload.feedError));
        }
      } catch { if (active) setFeedUnavailable(true); }
    };
    const interval = window.setInterval(refresh, 30_000);
    refresh();
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const formatScore = (event: BrainEvent) => `${event.home_score ?? 0} — ${event.away_score ?? 0}`;
  const formatStart = (event: BrainEvent) => new Date(event.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="live-programme" aria-live="polite">
      {feedUnavailable && <p className="live-refresh-note">Verified live feed temporarily unavailable. The programme is showing the last trusted state and will retry automatically.</p>}

      {programme.live.length > 0 && (
        <section className="detail-section" aria-labelledby="live-now-title">
          <div className="section-heading"><span>NOW</span><h2 id="live-now-title">LIVE NOW.</h2></div>
          <div className="live-list">
            {programme.live.map((event) => <MatchCard event={event} score={formatScore(event)} label="LIVE" key={event.id} />)}
          </div>
        </section>
      )}

      {programme.lead && programme.mode === 'PROGRAMME' && (
        <section className="detail-section" aria-labelledby="big-one-title">
          <div className="section-heading"><span>{programme.lead.priority === 'BLOCKBUSTER' ? 'THE BIG ONE' : 'WHAT’S NEXT'}</span><h2 id="big-one-title">{programme.lead.home_team.name} v {programme.lead.away_team.name}</h2></div>
          <article className="live-card">
            <div className="live-card__meta"><span className="live-badge">{programme.lead.priority}</span><span>{programme.lead.competition}</span></div>
            <div className="live-card__teams"><div><span>{programme.lead.home_team.name}</span><strong>{formatStart(programme.lead)}</strong></div><div><span>{programme.lead.away_team.name}</span><strong>{countdown(programme.lead.minutesUntilStart)}</strong></div></div>
          </article>
        </section>
      )}

      {programme.next.length > 0 && (
        <section className="detail-section" aria-labelledby="next-title">
          <div className="section-heading"><span>NEXT</span><h2 id="next-title">COMING UP.</h2></div>
          <div className="live-list">{programme.next.map((event) => <MatchCard event={event} score={countdown(event.minutesUntilStart)} label={event.priority} key={event.id} />)}</div>
        </section>
      )}

      {programme.recent.length > 0 && (
        <section className="detail-section" aria-labelledby="recent-title">
          <div className="section-heading"><span>AFTER THE WHISTLE</span><h2 id="recent-title">RECENT.</h2></div>
          <div className="live-list">{programme.recent.map((event) => <MatchCard event={event} score={formatScore(event)} label="FINAL" key={event.id} />)}</div>
        </section>
      )}

      {!programme.live.length && !programme.lead && (
        <section className="live-empty-with-news">
          <div className="empty-state"><strong>THE PROGRAMME IS ON.</strong><span>There is no verified live fixture in the current feed. We will automatically promote the next important event.</span></div>
          <section className="detail-section" aria-labelledby="latest-news-title">
            <div className="section-heading"><span>THE CULTURE</span><h2 id="latest-news-title">LATEST.</h2></div>
            <div className="index-grid">{articles.slice(0, 3).map((article) => <Link className="index-card" href={`/news/${article.slug}`} key={article.slug}><div aria-hidden="true" style={{ height: 180, marginBottom: 18, backgroundImage: `url(${articleImage(article.slug)})`, backgroundPosition: 'center', backgroundSize: 'cover', border: '1px solid var(--line)' }} /><span>{article.category} · {article.date}</span><b>{article.title}</b><small>{article.dek}</small></Link>)}</div>
          </section>
        </section>
      )}
    </div>
  );
}

function MatchCard({ event, score, label }: { event: BrainEvent; score: string; label: string }) {
  return <article className="live-card"><div className="live-card__meta"><span className="live-badge">{label}</span><span>{event.sport}</span><span>{event.competition}</span></div><div className="live-card__teams"><div><span>{event.home_team.name}</span><strong>{score}</strong></div><div><span>{event.away_team.name}</span><strong>{event.status === 'FINISHED' ? 'FINAL' : event.status === 'PAUSED' ? 'Half-time' : event.status === 'IN_PLAY' ? 'In play' : new Date(event.starts_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</strong></div></div></article>;
}

function countdown(minutes: number | undefined) {
  if (minutes === undefined) return 'TBC';
  if (minutes <= 0) return 'STARTS NOW';
  if (minutes < 60) return `IN ${minutes}M`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `IN ${hours}H ${remaining}M` : `IN ${hours}H`;
}
