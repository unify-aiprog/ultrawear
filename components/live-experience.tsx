'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LiveExperience } from '@/lib/sports/types';
import { applyParticipation, createFanProgress, FanProgress } from '@/lib/participation/progress';

type FeedResponse = { generatedAt: string; experiences: LiveExperience[] };

export function LiveExperience() {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [progress, setProgress] = useState<FanProgress>(() => {
    if (typeof window === 'undefined') return createFanProgress();
    try { return JSON.parse(localStorage.getItem('uw-fan-progress') || '') || createFanProgress(); } catch { return createFanProgress(); }
  });
  const [joined, setJoined] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const load = async () => { const response = await fetch('/api/live', { cache: 'no-store' }); if (response.ok && active) setData(await response.json()); };
    load(); const timer = window.setInterval(load, 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const top = useMemo(() => data?.experiences ?? [], [data]);
  const participate = (experience: LiveExperience, actionId: string, kind: 'prediction'|'poll'|'reaction'|'quest', points: number) => {
    const key = `${experience.event.id}:${actionId}`;
    if (joined[key]) return;
    const next = applyParticipation(progress, { id: `${key}:${Date.now()}`, eventId: experience.event.id, actionId, kind, points, createdAt: new Date().toISOString() });
    setProgress(next); setJoined((current) => ({ ...current, [key]: true }));
    localStorage.setItem('uw-fan-progress', JSON.stringify(next));
  };

  return <section className="uw-live-world" aria-labelledby="live-world-title">
    <div className="uw-live-world__head"><div><p className="uw-eyebrow">ULTRAWear / LIVE WORLD</p><h2 id="live-world-title">WHAT'S <span>HAPPENING</span></h2></div><div className="uw-progress" aria-label={`Level ${progress.level}, ${progress.xp} XP`}><b>LVL {progress.level}</b><span>{progress.xp} XP</span><small>{progress.participations} PARTICIPATIONS</small></div></div>
    <p className="uw-live-world__status"><i /> LIVE SIGNALS · AUTO-REFRESH 15S · {data ? new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'CONNECTING'}</p>
    <div className="uw-live-world__grid">{top.map((experience) => <article className="uw-event" key={experience.event.id}>
      <div className="uw-event__meta"><span>{experience.event.sport.toUpperCase()}</span><span>{experience.event.competition}</span><b>{experience.event.importance}</b></div>
      <div className="uw-event__teams"><strong>{experience.event.home}</strong><em>{experience.event.homeScore ?? '—'} : {experience.event.awayScore ?? '—'}</em><strong>{experience.event.away}</strong></div>
      <p className="uw-event__prompt">{experience.prompt}</p>
      <div className="uw-event__actions">{experience.actions.map((action) => <button key={action.id} disabled={joined[action.id]} onClick={() => participate(experience, action.id, action.kind, action.points)}>{joined[action.id] ? 'JOINED ✓' : `${action.label} +${action.points}XP`}</button>)}</div>
    </article>)}</div>
    {!data && <div className="uw-live-world__empty">CONNECTING TO THE SPORTS WORLD…</div>}
  </section>;
}
