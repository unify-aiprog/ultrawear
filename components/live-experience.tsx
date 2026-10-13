'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProgrammeEvent, SportsProgramme } from '@/lib/sports/programme';
import { programmeActions, type ParticipationAction } from '@/lib/participation/actions';
import { createFanProgress, type FanProgress } from '@/lib/participation/progress';

type FeedResponse = {
  generatedAt: string;
  mode?: string;
  stale?: boolean;
  programme?: SportsProgramme;
};
type IdentityResponse = { ok: boolean; identity?: { xp: number; level: number; streak: number; participations: number } };
type ParticipationResponse = { ok: boolean; duplicate?: boolean; preview?: boolean; identity?: IdentityResponse['identity'] };

type Action = ParticipationAction & { id: string };
type ParticipationNote = { tone: 'confirmed' | 'preview' | 'error'; message: string };

function actionsFor(event: ProgrammeEvent): Action[] {
  return programmeActions(event.status).map((action) => ({ ...action, id: action.actionId }));
}

export function LiveExperience() {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [progress, setProgress] = useState<FanProgress>(() => createFanProgress());
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<ParticipationNote | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [live, identity] = await Promise.all([
          fetch('/api/live', { cache: 'no-store' }),
          fetch('/api/identity', { cache: 'no-store' }),
        ]);
        if (live.ok && active) setData(await live.json());
        if (identity.ok && active) {
          const body = await identity.json() as IdentityResponse;
          if (body.identity) setProgress((current) => ({ ...current, ...body.identity }));
        }
      } catch {
        // Keep the last known programme visible while the next refresh reconnects.
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const events = useMemo(() => {
    const programme = data?.programme;
    if (!programme) return [];
    return [...programme.now, ...programme.next, ...programme.tonight, ...programme.tomorrow, ...programme.recent]
      .filter((event, index, all) => all.findIndex((candidate) => candidate.id === event.id) === index)
      .slice(0, 9);
  }, [data]);

  const participate = async (event: ProgrammeEvent, action: Action) => {
    const key = `${event.id}:${action.id}`;
    if (joined[key]) return;
    setJoined((current) => ({ ...current, [key]: true }));
    setNote(null);
    try {
      const response = await fetch('/api/participation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, actionId: action.id }),
      });
      const body = await response.json().catch(() => null) as ParticipationResponse | null;
      if (!response.ok || !body?.ok) throw new Error('Participation not recorded');
      if (body.identity) setProgress((current) => ({ ...current, ...body.identity }));
      if (body.preview) {
        setNote({ tone: 'preview', message: 'Preview only — progress is not saved on this device.' });
      } else if (body.duplicate) {
        setNote({ tone: 'confirmed', message: 'Already recorded — no extra XP awarded.' });
      } else {
        setNote({ tone: 'confirmed', message: `Recorded ✓ +${action.points} XP saved to your fan profile.` });
      }
    } catch {
      setJoined((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setNote({ tone: 'error', message: 'We could not record that participation. Please try again.' });
    }
  };

  const liveCount = data?.programme?.now.length ?? 0;
  const headline = data?.programme?.editorial.headline ?? 'THE SPORTS WORLD IS LOADING';
  const sourceState = data?.programme?.sourceHealth;
  const hasProgramme = Boolean(data?.programme);
  // Live status is only claimed when the programme is trustworthy. Simulated and
  // stale data are labelled so examples are never mistaken for real fixtures.
  const simulated = data?.mode === 'simulator-fallback';
  const stale = data?.mode === 'sports-brain-stale' || Boolean(data?.stale);
  const statusLabel = simulated
    ? 'SIMULATED PREVIEW DATA — NOT REAL FIXTURES'
    : stale
      ? 'LAST KNOWN DATA — MAY BE STALE'
      : liveCount
        ? `${liveCount} LIVE NOW`
        : 'LIVE PROGRAMME';

  return <section className="uw-live-world" aria-labelledby="live-world-title">
    <div className="uw-live-world__head">
      <div>
        <p className="uw-eyebrow">ULTRAWear / LIVE WORLD</p>
        <h2 id="live-world-title">SPORT <span>IS ON</span></h2>
        <p className="uw-live-world__headline">{headline}</p>
      </div>
      <div className="uw-progress" aria-label={`Level ${progress.level}, ${progress.xp} XP`}>
        <b>LVL {progress.level}</b><span>{progress.xp} XP</span><small>{progress.participations} PARTICIPATIONS · {progress.streak} DAY STREAK</small>
      </div>
    </div>

    <p className="uw-live-world__status">
      <i /> {statusLabel} · AUTO-REFRESH 15S · {data ? new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'CONNECTING'}
      {sourceState ? ` · ${sourceState.healthy} SOURCES LIVE` : ''}
    </p>

    {note && <output className={`uw-live-world__note uw-live-world__note--${note.tone}`}>{note.message}</output>}

    {events.length ? <div className="uw-live-world__grid">{events.map((event) => {
      const actions = actionsFor(event);
      const isLive = event.status === 'IN_PLAY' || event.status === 'PAUSED';
      const timeLabel = isLive ? 'LIVE NOW' : new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return <article className={`uw-event${isLive ? ' uw-event--live' : ''}`} key={event.id}>
        <div className="uw-event__meta"><span>{event.sport.toUpperCase()}</span><span>{event.competition}</span><b>{isLive ? 'LIVE' : event.priority}</b></div>
        <div className="uw-event__teams"><strong>{event.home?.name ?? 'TBC'}</strong><em>{event.homeScore ?? '—'} : {event.awayScore ?? '—'}</em><strong>{event.away?.name ?? 'TBC'}</strong></div>
        <p className="uw-event__prompt">{isLive ? `${event.competition} · LIVE NOW` : `${timeLabel} · ${event.competition}`}</p>
        {simulated && <p className="uw-event__source">UNVERIFIED SIMULATED EXAMPLE — NOT A REAL FIXTURE OR RESULT</p>}
        <div className="uw-event__actions">{actions.map((action) => { const key = `${event.id}:${action.id}`; return <button key={action.id} disabled={joined[key]} onClick={() => void participate(event, action)}>{joined[key] ? 'RECORDED ✓' : `${action.label} +${action.points}XP`}</button>; })}</div>
      </article>;
    })}</div> : <div className="uw-live-world__empty">{hasProgramme ? 'NO VERIFIED EVENTS IN THE CURRENT WINDOW.' : 'CONNECTING TO THE SPORTS WORLD…'}</div>}
  </section>;
}
