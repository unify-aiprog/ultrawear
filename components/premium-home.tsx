'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const sports = [['01','Football'],['02','Basketball'],['03','Tennis'],['04','Running'],['05','More sports']];
const stories = [['FOR COMMUNITY','Why the next generation of sport belongs to the community.','UW'],['THE GAME','The weekend, decoded.','FC'],['PEOPLE','Built by fans. Made for everyone.','FC']];
const news = [['THE CULTURE','The game is bigger than the score.'],['THE KIT','Built for movement. Made for more.'],['THE WEEKEND','Five things worth knowing.']];
const Arrow = () => <span aria-hidden="true">↗</span>;

export function PremiumHome() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const lenis = new Lenis({ autoRaf:false, smoothWheel:true, syncTouch:false });
    const raf = (time:number) => lenis.raf(time * 1000);
    const scroll = () => ScrollTrigger.update();
    lenis.on('scroll', scroll); gsap.ticker.add(raf); gsap.ticker.lagSmoothing(0);
    const ctx = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.from('.uw-hero__eyebrow,.uw-hero__title-line',{yPercent:115,opacity:0,duration:1,ease:'power4.out',stagger:.08});
      gsap.from('.uw-hero__copy,.uw-hero__actions',{y:24,opacity:0,duration:.8,stagger:.1,delay:.55});
      gsap.to('.uw-hero__orb',{yPercent:18,rotate:8,scrollTrigger:{trigger:'.uw-hero',start:'top top',end:'bottom top',scrub:1}});
      gsap.utils.toArray<HTMLElement>('.uw-reveal').forEach(el=>gsap.from(el,{y:50,opacity:0,duration:.85,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 84%',once:true}}));
      gsap.to('.uw-community__fc',{xPercent:12,scrollTrigger:{trigger:'.uw-community',start:'top bottom',end:'bottom top',scrub:1}});
      gsap.from('.uw-culture__card--accent',{rotate:-5,y:50,scrollTrigger:{trigger:'.uw-culture-block',start:'top 70%',end:'top 25%',scrub:1}});
    },root);
    return () => { ctx.revert(); lenis.off('scroll',scroll); gsap.ticker.remove(raf); lenis.destroy(); };
  },[]);

  return <div ref={root} className="uw-home">
    <header className="uw-header"><Link className="uw-logo" href="/">ULTRAWEAR <b>FC</b></Link><nav><a href="#happening">Football</a><a href="#community">Community</a><a href="#culture">Culture</a><a href="#sports">Sports</a><a href="#community">Forward</a></nav><Link className="uw-header__shop" href="/shop">Shop <Arrow /></Link></header>
    <section className="uw-hero"><div className="uw-hero__orb" aria-hidden="true"><b>FC</b><small>FOR COMMUNITY</small></div><div className="uw-hero__inner"><p className="uw-eyebrow uw-hero__eyebrow">THE NEW SPORTS CULTURE</p><h1><span className="uw-hero__title-line">PLAY</span><span className="uw-hero__title-line uw-outline">FOR</span><span className="uw-hero__title-line">MORE.</span></h1><p className="uw-hero__copy">Sport is bigger than the score. UltraWear FC connects the game, the culture and the people around it.</p><div className="uw-hero__actions"><Link className="uw-button uw-button--dark" href="/shop">ENTER THE GAME <Arrow /></Link><a className="uw-button" href="#community">JOIN THE COMMUNITY</a></div></div></section>
    <div className="uw-section-nav"><a href="#happening">Football</a><a href="#community">Community</a><a href="#culture">Culture</a><a href="#sports">Sports</a><a href="#community">Forward</a><a href="/fixtures">Football</a><a href="/live">Community</a></div>
    <main>
      <section className="uw-happening" id="happening"><div className="uw-section-intro uw-reveal"><p className="uw-eyebrow">COMMUNITY SIGNAL</p><h2>WHAT&apos;S <span>HAPPENING.</span></h2><Link href="/news">EXPLORE THE FEED <Arrow /></Link></div><div className="uw-feature-grid"><article className="uw-signal-card uw-reveal"><p>TRAINING <span>COMMUNITY SIGNAL</span></p><strong>Building the signal.</strong><small>A people-powered sports platform for everyone who lives for sport.</small></article><article className="uw-news-feature uw-reveal"><div className="uw-news-art"><span>THE FEED</span><i /></div><div><p>CULTURE</p><h3>The game is bigger than the score.</h3><small>Sport is community. Built around it.</small></div></article></div></section>
      <section className="uw-live uw-reveal"><div className="uw-section-intro"><p className="uw-eyebrow">RIGHT NOW</p><h2>LIVE <span>SPORT.</span></h2><Link href="/live">VIEW LIVE SPORT <Arrow /></Link></div><p className="uw-live-note"><b /> VERIFIED DATA AVAILABLE · VERIFIED FEEDS WILL DRIVE THESE CARDS. THIS PREVIEW NEVER INVENTS RESULTS.</p><div className="uw-news-row">{news.map(([tag,title],i)=><Link className="uw-news-card" href="/news" key={tag}><div className={`uw-news-card__art uw-news-card__art--${i+1}`}><span>0{i+1}</span></div><small>{tag}</small><h3>{title}</h3><p>News, people and culture around the game.</p></Link>)}</div></section>
      <section className="uw-sports" id="sports"><div className="uw-section-intro uw-reveal"><p className="uw-eyebrow">YOUR WORLD OF SPORT</p><h2>CHOOSE <span>YOUR GAME.</span></h2><Link href="/sports">ALL SPORTS <Arrow /></Link></div><div className="uw-sport-grid">{sports.map(([num,label],i)=><Link className={`uw-sport-tile ${i===4?'is-accent':''}`} href="/sports" key={num}><small>{num}</small><strong>{label}</strong><Arrow /></Link>)}</div></section>
      <section className="uw-culture" id="culture"><div className="uw-section-intro uw-reveal"><p className="uw-eyebrow">THE FEED</p><h2>SPORT.<br/><span>UNFILTERED.</span></h2><Link href="/news">ALL STORIES <Arrow /></Link></div><div className="uw-story-grid">{stories.map(([tag,title,mark],i)=><Link className="uw-story-card uw-reveal" href="/news" key={tag}><div className={`uw-story-art art-${i+1}`}><span>{tag}</span><b>{mark}</b></div><small>{tag}</small><h3>{title}</h3><p>News, people and culture around the game.</p></Link>)}</div></section>
      <section className="uw-community" id="community"><div className="uw-community__fc" aria-hidden="true">FC</div><div className="uw-community__content uw-reveal"><p className="uw-eyebrow">THIS IS THE POINT</p><h2>FC MEANS<br/><span>FOR<br/>COMMUNITY.</span></h2><p>We believe sport is a shared language. A shirt, a match, a run, a conversation — every part of it brings people together.</p><Link className="uw-button uw-button--lime" href="/about">BE PART OF IT <Arrow /></Link></div></section>
      <section className="uw-culture-block"><div className="uw-culture-copy uw-reveal"><p className="uw-eyebrow">COMING SOON</p><h2>THE <span>CULTURE.</span></h2><p>Football-inspired today. Sports and lifestyle tomorrow. UltraWear FC is just getting started.</p><Link href="/about">EXPLORE ULTRAWEAR <Arrow /></Link></div><div className="uw-culture__card uw-culture__card--accent"><small>FOR COMMUNITY</small><strong>WEAR</strong><span>FC · FOR COMMUNITY</span></div></section>
    </main>
    <footer className="uw-footer"><div className="uw-footer__brand">ULTRAWEAR <b>FC</b><small>© 2026 UltraWear FC. Built for the culture.</small></div><p>FC = FOR COMMUNITY.</p><nav><Link href="/shop">Shop</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></footer>
  </div>;
}
