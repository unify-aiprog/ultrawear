'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProgrammeEvent, SportsProgramme } from '@/lib/sports/programme';
import { applyParticipation, createFanProgress, FanProgress } from '@/lib/participation/progress';

type FeedResponse = {
  generatedAt: string;
  mode?: string;
  stale?: boolean;
  programme?: SportsProgramme;
};
type IdentityResponse = { ok: boolean; identity?: { xp: number; level: number; streak: number; participations: number } };

type Action = { id: string; kind: 'prediction' | 'poll' | 'reaction' | 'quest'; label: string; points: number };

function actionsFor(event: ProgrammeEvent): Action[] {
  const live = event.status === 'IN_PLAY' || event.status === 'PAUSED';
  return live
    ? [
        { id: 'pulse', kind: 'reaction', label: 'JOIN THE PULSE', points: 10 },
        { id: 'winner', kind: 'prediction', label: 'PICK THE WINNER', points: 20 },
        { id: 'quest', kind: 'quest', label: 'JOIN QUEST', points: 30 },
      ]
    : [
        { id: 'watch', kind: 'quest', label: 'FOLLOW EVENT', points: 10 },
        { id: 'prediction', kind: 'prediction', label: 'MAKE PREDICTION', points: 20 },
        { id: 'pulse', kind: 'poll', label: 'JOIN THE PULSE', points: 15 },
      ];
}

export function LiveExperience() {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [progress, setProgress] = useState<FanProgress>(() => {
    if (typeof window === 'undefined') return createFanProgress();
    try { return JSON.parse(localStorage.getItem('uw-fan-progress') || '') || createFanProgress(); } catch { return createFanProgress(); }
  });
  const [joined, setJoined] = useState<Record<string, boolean>>({});

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
    try {
      const response = await fetch('/api/participation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: `${key}:${crypto.randomUUID()}`, eventId: event.id, actionId: action.id, kind: action.kind, points: action.points }),
      });
      if (!response.ok) throw new Error('Participation failed');
      const body = await response.json() as { identity: IdentityResponse['identity'] };
      if (body.identity) setProgress((current) => ({ ...current, ...body.identity }));
    } catch {
      const next = applyParticipation(progress, {
        id: `${key}:${Date.now()}`,
        eventId: event.id,
        actionId: action.id,
        kind: action.kind,
        points: action.points,
        createdAt: new Date().toISOString(),
      });
      setProgress(next);
      localStorage.setItem('uw-fan-progress', JSON.stringify(next));
    }
  };

  const liveCount = data?.programme?.now.length ?? 0;
  const headline = data?.programme?.editorial.headline ?? 'THE SPORTS WORLD IS LOADING';
  const sourceState = data?.programme?.sourceHealth;
  const hasProgramme = Boolean(data?.programme);

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
      <i /> {liveCount ? `${liveCount} LIVE NOW` : 'LIVE PROGRAMME'} · AUTO-REFRESH 15S · {data ? new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'CONNECTING'}
      {sourceState ? ` · ${sourceState.healthy} SOURCES LIVE` : ''}
    </p>

    {events.length ? <div className="uw-live-world__grid">{events.map((event) => {
      const actions = actionsFor(event);
      const isLive = event.status === 'IN_PLAY' || event.status === 'PAUSED';
      const timeLabel = isLive ? 'LIVE NOW' : new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return <article className={`uw-event${isLive ? ' uw-event--live' : ''}`} key={event.id}>
        <div className="uw-event__meta"><span>{event.sport.toUpperCase()}</span><span>{event.competition}</span><b>{isLive ? 'LIVE' : event.priority}</b></div>
        <div className="uw-event__teams"><strong>{event.home?.name ?? 'TBC'}</strong><em>{event.homeScore ?? '—'} : {event.awayScore ?? '—'}</em><strong>{event.away?.name ?? 'TBC'}</strong></div>
        <p className="uw-event__prompt">{isLive ? `${event.competition} · LIVE NOW` : `${timeLabel} · ${event.competition}`}</p>
        <div className="uw-event__actions">{actions.map((action) => { const key = `${event.id}:${action.id}`; return <button key={action.id} disabled={joined[key]} onClick={() => void participate(event, action)}>{joined[key] ? 'JOINED ✓' : `${action.label} +${action.points}XP`}</button>; })}</div>
      </article>;
    })}</div> : <div className="uw-live-world__empty">{hasProgramme ? 'NO VERIFIED EVENTS IN THE CURRENT WINDOW.' : 'CONNECTING TO THE SPORTS WORLD…'}</div>}
  </section>;
}
