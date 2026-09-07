'use client';

import { useMemo, useState } from 'react';
import { buildQuests } from '@/lib/participation/quests';

export function QuestBoard() {
  const [completed, setCompleted] = useState<string[]>([]);
  const quests = useMemo(() => buildQuests(), []);
  return <section className="uw-quests" aria-labelledby="quests-title">
    <div className="uw-quests__head"><div><p className="uw-eyebrow">PARTICIPATION SYSTEM</p><h2 id="quests-title">TODAY'S <span>QUESTS</span></h2></div><strong>{completed.length}/{quests.length} COMPLETE</strong></div>
    <div className="uw-quests__grid">{quests.map((quest) => { const done = completed.includes(quest.id); return <article className={done ? 'is-complete' : ''} key={quest.id}><div><span>{quest.kind.toUpperCase()}</span><b>+{quest.points} XP</b></div><h3>{quest.title}</h3><p>{quest.description}</p><button disabled={done} onClick={() => setCompleted((current) => [...current, quest.id])}>{done ? 'COMPLETE ✓' : 'ACCEPT QUEST'}</button></article>; })}</div>
  </section>;
}
