import type { Metadata } from 'next';
import { getLiveEvents } from '@/lib/ingest/football-live';
import { LiveMatchList } from '@/components/live-match-list';

export const metadata: Metadata = {
  title: 'Live Football | UltraWear FC',
  description: 'Follow live football scores and match status across the UltraWear FC catalogue.',
};

export default async function LivePage() {
  const events = await getLiveEvents();
  return (
    <div className="page-wrap">
      <section className="page-hero">
        <p className="eyebrow">MATCHDAY</p>
        <h1>Live now.</h1>
        <p>Scores and match status update automatically while games are in play.</p>
      </section>
      <section className="section-block">
        <LiveMatchList initialEvents={events} />
      </section>
    </div>
  );
}
