'use client';

import Link from 'next/link';
import { useState } from 'react';

type WeekendGalleryEvent = {
  id: string;
  starts_at: string | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  competitions_v2: { name: string; slug: string; sport_id: string } | null;
  home_team: { name: string; slug: string } | null;
  away_team: { name: string; slug: string } | null;
};

const visualThemes = ['violet', 'lime', 'blue', 'orange', 'red', 'ice'];

function formatKickoff(value: string | null) {
  if (!value) return 'TIME TBD';
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDay(value: string | null) {
  if (!value) return 'WEEKEND';
  return new Date(value).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
}

export function WeekendGallery({ events }: { events: WeekendGalleryEvent[] }) {
  const [active, setActive] = useState(0);
  const cards = events.slice(0, 10);

  if (!cards.length) {
    return (
      <section className="weekend-gallery" aria-labelledby="weekend-gallery-heading">
        <div className="weekend-gallery__intro">
          <p className="eyebrow">THE WEEKEND AWAITS</p>
          <h2 id="weekend-gallery-heading">GAME DAY<br /><em>IS LOADING.</em></h2>
          <p>Verified fixtures will take over this gallery as the live catalogue connects.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="weekend-gallery" aria-labelledby="weekend-gallery-heading">
      <div className="weekend-gallery__topline">
        <div>
          <p className="eyebrow">WEEKEND / ALL ACTION</p>
          <h2 id="weekend-gallery-heading">PICK<br /><em>YOUR MOMENT.</em></h2>
        </div>
        <div className="weekend-gallery__hint">MOVE / HOVER / EXPLORE</div>
      </div>

      <ul className="weekend-gallery__track" aria-label="Weekend sports events">
        {cards.map((event, index) => {
          const home = event.home_team?.name ?? 'HOME';
          const away = event.away_team?.name ?? 'AWAY';
          const theme = visualThemes[index % visualThemes.length];
          const isActive = active === index;
          return (
            <li key={event.id} className="weekend-gallery__item">
              <Link
                className={`weekend-gallery__card weekend-gallery__card--${theme} ${isActive ? 'is-active' : ''}`}
                href={`/matches/${event.id}`}
                aria-label={`${home} versus ${away}`}
                onFocus={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                  const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
                  e.currentTarget.style.setProperty('--mx', `${x.toFixed(2)}`);
                  e.currentTarget.style.setProperty('--my', `${y.toFixed(2)}`);
                }}
              >
                <div className="weekend-gallery__art" aria-hidden="true"><span /><i /><b>{String(index + 1).padStart(2, '0')}</b></div>
                <div className="weekend-gallery__meta">
                  <span>{formatDay(event.starts_at)}</span>
                  <span>{formatKickoff(event.starts_at)}</span>
                </div>
                <div className="weekend-gallery__match">
                  <small>{event.competitions_v2?.name ?? 'SPORT'}</small>
                  <strong>{home}</strong>
                  <strong>{away}</strong>
                </div>
                <div className="weekend-gallery__footer">
                  <span>{event.status ?? 'Scheduled'}</span>
                  <span>EXPLORE ↗</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="weekend-gallery__controls" aria-label="Gallery controls">
        {cards.map((event, index) => (
          <button key={event.id} type="button" className={active === index ? 'is-active' : ''} aria-label={`Show event ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)}>{String(index + 1).padStart(2, '0')}</button>
        ))}
      </div>
    </section>
  );
}
