import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Matches | UltraWear FC',
  description: 'Verified matchday coverage from the UltraWear sports programme.',
};

export default function MatchesPage() {
  return (
    <main className="page-wrap">
      <section className="page-hero">
        <p className="eyebrow">MATCHDAY</p>
        <h1>The matches that matter.</h1>
        <p>Follow verified fixtures and match context without separating the event from the story.</p>
      </section>
      <section className="detail-section">
        <div className="section-heading">
          <p className="eyebrow">PROGRAMME</p>
          <h2>Start with what is live and what is next.</h2>
        </div>
        <div className="index-grid">
          <article className="index-card">
            <span className="eyebrow">LIVE</span>
            <h3>Live sports programme</h3>
            <p>Verified live, upcoming and recent events are organised by the Sports Brain.</p>
            <Link className="button" href="/live">Open Live Sport</Link>
          </article>
          <article className="index-card">
            <span className="eyebrow">FIXTURES</span>
            <h3>Browse the schedule</h3>
            <p>Explore the fixture surface while the broader programme determines importance.</p>
            <Link className="button" href="/fixtures">Open Fixtures</Link>
          </article>
        </div>
      </section>
    </main>
  );
}
