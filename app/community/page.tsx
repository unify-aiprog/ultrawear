import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Community | UltraWear FC',
  description: 'The UltraWear community: sport, culture and shared action.',
};

export default function CommunityPage() {
  return (
    <main className="page-wrap">
      <section className="page-hero">
        <p className="eyebrow">FOR COMMUNITY</p>
        <h1>Sport is better together.</h1>
        <p>Follow the people, moments and conversations that turn sport into community.</p>
      </section>
      <section className="detail-section">
        <div className="section-heading">
          <p className="eyebrow">THE COMMUNITY</p>
          <h2>Stay connected to the wider game.</h2>
        </div>
        <div className="index-grid">
          <article className="index-card">
            <span className="eyebrow">LIVE</span>
            <h3>What is happening now</h3>
            <p>Move from the community conversation into the verified live sports programme.</p>
            <Link className="button" href="/live">Open Live Sport</Link>
          </article>
          <article className="index-card">
            <span className="eyebrow">WEEKEND</span>
            <h3>This weekend, together</h3>
            <p>See the customer-facing weekend programme and its trusted-state reporting.</p>
            <Link className="button" href="/weekend">Open Weekend</Link>
          </article>
        </div>
      </section>
    </main>
  );
}
