import Link from 'next/link';
import { AdSlot } from '@/components/ad-slot';
import { WeekendAction, getWeekendActionEvents } from '@/components/weekend-action';

export const revalidate = 120;

export default async function HomePage() {
  const weekendEvents = await getWeekendActionEvents();
  return <>
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow"><span className="pulse" /> THE NEW SPORTS CULTURE</p>
        <h1>PLAY<br /><em>FOR</em><br />MORE.</h1>
        <p className="lede">Sport is bigger than the score. UltraWear FC connects the game, the culture and the people around it.</p>
        <div className="actions"><Link className="button primary" href="/sports">Explore sport <span>↗</span></Link><Link className="button ghost" href="/news">Read the feed</Link></div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="orb" /><div className="ring ring-a" /><div className="ring ring-b" /><div className="hero-label">FC<br /><small>FOR COMMUNITY</small></div></div>
    </section>

    <div className="ticker" aria-label="UltraWear message">{['FOOTBALL','COMMUNITY','CULTURE','SPORTS','FORWARD'].map(item => <span key={item}>{item}</span>)}</div>

    <WeekendAction events={weekendEvents} />

    <section className="section" aria-labelledby="sports-heading">
      <div className="section-head"><div><p className="eyebrow">YOUR WORLD OF SPORT</p><h2 id="sports-heading">CHOOSE<br /><span>YOUR GAME.</span></h2></div><Link className="text-link" href="/sports">All sports ↗</Link></div>
      <div className="sport-grid">{[['01','Football'],['02','Basketball'],['03','Tennis'],['04','Running']].map(([n,name]) => <Link className="sport-card" href="/sports" key={name}><span>{n}</span><b>{name}</b><i>↗</i></Link>)}</div>
    </section>

    <AdSlot minHeight={250} />

    <section className="community" aria-labelledby="community-heading"><div className="community-mark">FC</div><div><p className="eyebrow">THIS IS THE POINT</p><h2 id="community-heading">FC MEANS<br /><em>FOR COMMUNITY.</em></h2><p>We believe sport is a shared language. A shirt, a match, a run, a conversation — every part of it brings people together.</p><Link className="button primary" href="/about">Discover the vision <span>↗</span></Link></div></section>
  </>;
}
