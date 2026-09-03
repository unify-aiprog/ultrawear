'use client';

import { useEffect, useState } from 'react';

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
    return <div className="empty-state"><strong>{feedUnavailable ? 'Live feed temporarily unavailable.' : 'No matches live right now.'}</strong><span>{feedUnavailable ? 'We are retrying automatically. No demo or stale scores are shown.' : 'Live fixtures appear automatically when the verified feed reports a match in play.'}</span></div>;
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
