'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LiveExperience } from '@/lib/sports/types';
import { applyParticipation, createFanProgress, type FanProgress } from '@/lib/participation/progress';

type FeedResponse = { generatedAt: string; experiences: LiveExperience[] };
type IdentityResponse = { ok: boolean; identity?: { xp: number; level: number; streak: number; participations: number } };

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
      const [live, identity] = await Promise.all([fetch('/api/live', { cache: 'no-store' }), fetch('/api/identity', { cache: 'no-store' })]);
      if (live.ok && active) setData(await live.json());
      if (identity.ok && active) {
        const body = await identity.json() as IdentityResponse;
        if (body.identity) setProgress((current) => ({ ...current, ...body.identity }));
      }
    };
    load(); const timer = window.setInterval(load, 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const top = useMemo(() => data?.experiences ?? [], [data]);
  const participate = async (experience: LiveExperience, actionId: string, kind: 'prediction'|'poll'|'reaction'|'quest', points: number) => {
    const key = `${experience.event.id}:${actionId}`;
    if (joined[key]) return;
    setJoined((current) => ({ ...current, [key]: true }));
    try {
      const response = await fetch('/api/participation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `${key}:${crypto.randomUUID()}`, eventId: experience.event.id, actionId, kind, points }) });
      if (!response.ok) throw new Error('Participation failed');
      const body = await response.json() as { identity: IdentityResponse['identity'] };
      if (body.identity) setProgress((current) => ({ ...current, ...body.identity }));
    } catch {
      const next = applyParticipation(progress, { id: `${key}:${Date.now()}`, eventId: experience.event.id, actionId, kind, points, createdAt: new Date().toISOString() });
      setProgress(next); localStorage.setItem('uw-fan-progress', JSON.stringify(next));
    }
  };

  return <section className="uw-live-world" aria-labelledby="live-world-title">
    <div className="uw-live-world__head"><div><p className="uw-eyebrow">ULTRAWear / LIVE WORLD</p><h2 id="live-world-title">WHAT'S <span>HAPPENING</span></h2></div><div className="uw-progress" aria-label={`Level ${progress.level}, ${progress.xp} XP`}><b>LVL {progress.level}</b><span>{progress.xp} XP</span><small>{progress.participations} PARTICIPATIONS · {progress.streak} DAY STREAK</small></div></div>
    <p className="uw-live-world__status"><i /> LIVE SIGNALS · AUTO-REFRESH 15S · {data ? new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'CONNECTING'}</p>
    <div className="uw-live-world__grid">{top.map((experience) => <article className="uw-event" key={experience.event.id}>
      <div className="uw-event__meta"><span>{experience.event.sport.toUpperCase()}</span><span>{experience.event.competition}</span><b>{experience.event.importance}</b></div>
      <div className="uw-event__teams"><strong>{experience.event.home}</strong><em>{experience.event.homeScore ?? '—'} : {experience.event.awayScore ?? '—'}</em><strong>{experience.event.away}</strong></div>
      <p className="uw-event__prompt">{experience.prompt}</p>
      <div className="uw-event__actions">{experience.actions.map((action) => { const key = `${experience.event.id}:${action.id}`; return <button key={action.id} disabled={joined[key]} onClick={() => void participate(experience, action.id, action.kind, action.points)}>{joined[key] ? 'JOINED ✓' : `${action.label} +${action.points}XP`}</button>; })}</div>
    </article>)}</div>
    {!data && <div className="uw-live-world__empty">CONNECTING TO THE SPORTS WORLD…</div>}
  </section>;
}
