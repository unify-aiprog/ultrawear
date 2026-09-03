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

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/live', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json() as { events: LiveEvent[]; updatedAt: string };
        if (active) { setEvents(payload.events); setUpdatedAt(payload.updatedAt); }
      } catch { /* keep the last known live state */ }
    };
    const interval = window.setInterval(refresh, 60_000);
    refresh();
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  if (!events.length) {
    return <div className="empty-state"><strong>No matches live right now.</strong><span>Live fixtures appear automatically when the feed reports a match in play.</span></div>;
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
      <p className="live-refresh-note">Auto-updates every 60 seconds{updatedAt ? ` · feed checked ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}.</p>
    </div>
  );
}
