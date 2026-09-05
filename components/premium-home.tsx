'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const collection = [
  ['01', 'CORE', 'THE EVERYDAY JERSEY', '01'],
  ['02', 'TRAINING', 'MADE TO MOVE', '02'],
  ['03', 'EVERYDAY', 'OFF-PITCH UNIFORM', '03'],
  ['04', 'COMMUNITY', 'WEAR THE MESSAGE', '04'],
];

export function PremiumHome() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false });
    const onScroll = () => ScrollTrigger.update();
    const onTick = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', onScroll);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced) {
        gsap.from('.premium-hero__kicker, .premium-hero__line', { yPercent: 110, opacity: 0, duration: 1.1, ease: 'power4.out', stagger: 0.07, delay: 0.15 });
        gsap.from('.premium-hero__cta', { y: 20, opacity: 0, duration: 0.8, delay: 0.75, ease: 'power3.out' });
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
        });
        gsap.to('.premium-editorial__orb', { yPercent: -16, scrollTrigger: { trigger: '.premium-editorial', scrub: 1 } });
        gsap.to('.premium-fc__mark', { scale: 15, ease: 'none', scrollTrigger: { trigger: '.premium-fc', start: 'top top', end: '+=1400', scrub: 1, pin: true } });
        gsap.from('.premium-fc__words span', { yPercent: 120, opacity: 0, stagger: 0.08, scrollTrigger: { trigger: '.premium-fc', start: 'top 65%', once: true } });
      }

      mm.add('(min-width: 768px)', () => {
        const track = document.querySelector<HTMLElement>('.premium-collection__track');
        const section = document.querySelector<HTMLElement>('.premium-collection');
        if (!track || !section || reduced) return;
        const tween = gsap.to(track, { x: () => -(track.scrollWidth - window.innerWidth), ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${track.scrollWidth - window.innerWidth}`, scrub: 1, pin: true, invalidateOnRefresh: true } });
        return () => tween.kill();
      });

      return () => mm.revert();
    }, root);

    return () => {
      ctx.revert();
      lenis.off('scroll', onScroll);
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={root} className="premium-home">
      <header className="premium-nav">
        <Link href="/" className="premium-nav__brand" aria-label="UltraWear FC home">ULTRAWEAR <b>FC</b></Link>
        <nav aria-label="Primary"><a href="#collection">SHOP</a><a href="#community">COMMUNITY</a><a href="#culture">CULTURE</a></nav>
        <a className="premium-nav__menu" href="#footer">MENU <span>↗</span></a>
      </header>

      <section className="premium-hero">
        <div className="premium-hero__media" aria-hidden="true"><div className="premium-hero__shape premium-hero__shape--a" /><div className="premium-hero__shape premium-hero__shape--b" /><div className="premium-hero__grain" /></div>
        <div className="premium-hero__content">
          <p className="premium-hero__kicker">FC / FOR COMMUNITY / 2026</p>
          <h1 className="premium-hero__title"><span className="premium-hero__line">THE GAME</span><span className="premium-hero__line">IS BIGGER</span><span className="premium-hero__line"><em>THAN THE GAME.</em></span></h1>
          <p className="premium-hero__sub">Sportswear for the movement around sport. Football is the beginning. Community is the destination.</p>
          <a className="premium-hero__cta" href="#collection">SHOP THE DROP <span>↗</span></a>
        </div>
        <div className="premium-hero__scroll">SCROLL TO MOVE <span>↓</span></div>
      </section>

      <section className="premium-manifesto" id="community">
        <p className="premium-label" data-reveal>01 / THE MANIFESTO</p>
        <h2 data-reveal>WE DON&apos;T JUST<br />MAKE SPORTSWEAR.<br /><em>WE MAKE BELONGING.</em></h2>
        <p className="premium-copy" data-reveal>Every match has a world around it. The streets, the music, the rituals, the people. UltraWear FC exists for that world — and everyone who moves through it.</p>
      </section>

      <section className="premium-collection" id="collection">
        <div className="premium-collection__intro"><p className="premium-label">02 / FEATURED COLLECTION</p><h2>BUILT FOR<br /><em>THE MOVEMENT.</em></h2></div>
        <div className="premium-collection__track">{collection.map(([num, tag, title, ghost]) => <article className="premium-product" key={num}><div className="premium-product__visual"><span>{ghost}</span><i /></div><div className="premium-product__meta"><small>{num} / {tag}</small><h3>{title}</h3><b>EXPLORE ↗</b></div></article>)}</div>
      </section>

      <section className="premium-editorial" id="culture"><div className="premium-editorial__orb" /><div className="premium-editorial__copy"><p className="premium-label">03 / EDITORIAL</p><h2>ENGINEERED<br /><em>FOR MOVEMENT.</em></h2><p className="premium-copy">Performance language. Street attitude. Designed to live between training, culture and everything after.</p><a href="/about">READ THE STORY ↗</a></div></section>

      <section className="premium-fc"><div className="premium-fc__mark">FC</div><div className="premium-fc__words"><span>FOR</span><span>COMMUNITY.</span></div></section>

      <section className="premium-culture"><div className="premium-section-head"><p className="premium-label">05 / CULTURE</p><h2>MORE THAN<br /><em>A MATCH.</em></h2></div><div className="premium-culture__grid">{['TRAINING', 'MUSIC', 'CULTURE', 'COMMUNITY'].map((item, i) => <a href="/sports" className={`premium-culture__card premium-culture__card--${i + 1}`} key={item}><span>0{i + 1}</span><strong>{item}</strong><i>↗</i></a>)}</div></section>

      <section className="premium-stories"><p className="premium-label">06 / COMMUNITY STORIES</p><div className="premium-stories__list">{['THE PLAYER', 'THE CREATOR', 'THE COACH', 'THE COMMUNITY'].map((item, i) => <a href="/about" key={item}><span>0{i + 1}</span><b>{item}</b><i>↗</i></a>)}</div></section>

      <section className="premium-cta"><p className="premium-label">07 / LATEST DROP</p><h2>READY<br /><em>TO MOVE?</em></h2><a href="#collection">SHOP ULTRAWEAR FC ↗</a></section>

      <footer className="premium-footer" id="footer"><div><div className="premium-footer__brand">ULTRAWEAR <b>FC</b></div><p>FOR COMMUNITY.</p></div><div className="premium-footer__links"><a href="/shop">SHOP</a><a href="/about">ABOUT</a><a href="/contact">CONTACT</a><a href="/privacy">PRIVACY</a></div><small>© 2026 ULTRAWEAR FC / BUILT FOR THE CULTURE.</small></footer>
    </div>
  );
}
