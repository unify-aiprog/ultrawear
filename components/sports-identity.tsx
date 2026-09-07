'use client';

import { useState } from 'react';
import { loadSportsIdentity, saveSportsIdentity, toggleInterest, follow, type SportsIdentity, type SportsInterest } from '@/lib/identity/sports-identity';
import { trackAudienceEvent } from '@/lib/analytics/audience-events';

const interests: SportsInterest[] = ['football', 'basketball', 'athletics', 'tennis', 'motorsport', 'womens-sport', 'emerging-sport'];
const discovery = [
  { kind: 'team' as const, label: 'Nigeria', group: 'Teams' },
  { kind: 'team' as const, label: 'Arsenal', group: 'Teams' },
  { kind: 'athlete' as const, label: 'Rising athletes', group: 'Athletes' },
  { kind: 'community' as const, label: 'Women’s sports', group: 'Communities' },
  { kind: 'community' as const, label: 'African sport', group: 'Communities' },
];

export function SportsIdentity() {
  const [identity, setIdentity] = useState<SportsIdentity>(() => loadSportsIdentity());
  const [editing, setEditing] = useState(false);
  const update = (next: SportsIdentity) => { setIdentity(next); saveSportsIdentity(next); };
  const followCollection = (kind: 'team' | 'athlete' | 'community') => kind === 'team' ? 'followedTeams' : kind === 'athlete' ? 'followedAthletes' : 'followedCommunities';
  return <section className="uw-identity" aria-labelledby="identity-title">
    <div className="uw-identity__hero"><div><p className="uw-eyebrow">SPORTS IDENTITY</p><h2 id="identity-title">YOUR <span>SPORTS WORLD</span></h2><p>Choose what matters to you. UltraWear uses your signals to shape discovery, live moments and community.</p></div><div className="uw-identity__badge"><b>LVL {identity.level}</b><span>{identity.xp} XP</span><small>{identity.badges.length} BADGES</small></div></div>
    <div className="uw-identity__grid"><div className="uw-identity__card"><div className="uw-card-head"><span>@{identity.handle}</span><button onClick={() => setEditing(!editing)}>{editing ? 'DONE' : 'EDIT IDENTITY'}</button></div>{editing ? <label className="uw-name-field">DISPLAY NAME<input value={identity.displayName} onChange={(event) => update({ ...identity, displayName: event.target.value })} maxLength={32} /></label> : <h3>{identity.displayName}</h3>}<p>INTERESTS</p><div className="uw-chips">{interests.map((interest) => <button className={identity.interests.includes(interest) ? 'is-active' : ''} key={interest} onClick={() => { update(toggleInterest(identity, interest)); trackAudienceEvent('interest_toggle', { interest }); }}>{interest.replace('-', ' ').toUpperCase()}</button>)}</div></div>
      <div className="uw-identity__card"><div className="uw-card-head"><span>DISCOVER & FOLLOW</span><small>YOUR FEED LEARNS</small></div><div className="uw-discovery">{discovery.map((item) => { const collection = followCollection(item.kind); const active = identity[collection].includes(item.label); return <button className={active ? 'is-following' : ''} key={`${item.kind}-${item.label}`} onClick={() => { update(follow(identity, collection, item.label)); trackAudienceEvent('follow_toggle', { kind: item.kind, target: item.label, following: !active }); }}><span>{item.group}</span><b>{item.label}</b><em>{active ? 'FOLLOWING ✓' : '+ FOLLOW'}</em></button>; })}</div></div></div>
  </section>;
}
