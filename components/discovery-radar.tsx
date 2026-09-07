'use client';

import { useMemo } from 'react';
import { loadSportsIdentity } from '@/lib/identity/sports-identity';
import { recommendDiscovery } from '@/lib/recommendations/discovery';
import { trackAudienceEvent } from '@/lib/analytics/audience-events';

export function DiscoveryRadar() {
  const identity = loadSportsIdentity();
  const items = useMemo(() => recommendDiscovery(identity.interests, 3), [identity.interests]);
  return <section className="uw-radar" aria-labelledby="radar-title"><div className="uw-radar__head"><div><p className="uw-eyebrow">SERENDIPITY ENGINE</p><h2 id="radar-title">STEP <span>OUTSIDE</span></h2></div><p>Discovery should expand your sports world, not trap you inside a filter bubble.</p></div><div className="uw-radar__grid">{items.map((item) => <article key={item.id}><span>{item.sport.replace('-', ' ').toUpperCase()}</span><h3>{item.title}</h3><p>{item.reason}</p><div>{item.tags.map((tag) => <small key={tag}>#{tag}</small>)}</div><button onClick={() => trackAudienceEvent('follow_toggle', { kind: 'discovery', target: item.id })}>ADD TO MY WORLD +</button></article>)}</div></section>;
}
