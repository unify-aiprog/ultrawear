'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { articles } from '@/lib/editorial';

type LiveEvent = {
  id: string;
  starts_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  competition: string;
  home_team: { name: string; crest_url: string | null };
  away_team: { name: string; crest_url: string | null };
};

export function LiveMatchList({ initialEvents }: { initialEvents: LiveEvent[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [feedUnavailable, setFeedUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/live?refresh=${Date.now()}`, {
          cache: 'no-store',
          headers: { accept: 'application/json', 'cache-control': 'no-cache' },
        });
        if (!response.ok) {
          if (active) setFeedUnavailable(true);
          return;
        }
        const payload = await response.json() as { events?: LiveEvent[]; updatedAt?: string };
        if (active) {
          setEvents(Array.isArray(payload.events) ? payload.events : []);
          setUpdatedAt(payload.updatedAt ?? null);
          setFeedUnavailable(false);
        }
      } catch {
        if (active) setFeedUnavailable(true);
      }
    };
    const interval = window.setInterval(refresh, 30_000);
    refresh();
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  if (!events.length) {
    const latest = articles.slice(0, 3);
    return (
      <div className="live-empty-with-news">
        <div className="empty-state">
          <strong>{feedUnavailable ? 'No verified live match right now.' : 'No match is live right now.'}</strong>
          <span>{feedUnavailable ? 'The verified score feed is being retried automatically.' : 'Instead of showing a dead end, catch up on the latest UltraWear FC stories.'}</span>
        </div>
        <section className="detail-section" aria-labelledby="latest-news-title">
          <div className="section-heading"><span>NEWS</span><h2 id="latest-news-title">LATEST.</h2></div>
          <div className="index-grid">
            {latest.map((article) => (
              <Link className="index-card" href={`/news/${article.slug}`} key={article.slug}>
                <div className="news-card-image" style={{ backgroundImage: `url(/assets/${article.slug === 'the-game-is-bigger-than-the-score' ? 'news-community.svg' : article.slug === 'built-by-fans-made-for-everyone' ? 'news-matchday.svg' : 'news-sport-world.svg'})` }} aria-hidden="true" />
                <span>{article.category} · {article.date}</span>
                <b>{article.title}</b>
                <small>{article.dek}</small>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="live-list" aria-live="polite">
      {events.map((event) => (
        <article className="live-card" key={event.id}>
          <div className="live-card__meta"><span className="live-badge">LIVE</span><span>{event.competition}</span><span>{event.status === 'PAUSED' ? 'Half-time' : 'In play'}</span></div>
          <div className="live-card__teams">
            <div><span>{event.home_team.name}</span><strong>{event.home_score ?? 0}</strong></div>
            <div><span>{event.away_team.name}</span><strong>{event.away_score ?? 0}</strong></div>
          </div>
        </article>
      ))}
      <p className="live-refresh-note">Auto-updates every 30 seconds{updatedAt ? ` · feed checked ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}.</p>
    </div>
  );
}
