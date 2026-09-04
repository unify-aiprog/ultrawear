import type { Metadata } from 'next';
import { getProgrammeEvents } from '@/lib/ingest/football-live';
import { buildProgramme } from '@/lib/sports-brain';
import { LiveMatchList } from '@/components/live-match-list';

export const metadata: Metadata = {
  title: 'Live Sport | UltraWear FC',
  description: 'The live sports programme: what is happening now, what is next and what matters.',
};

export default async function LivePage() {
  const programme = buildProgramme(await getProgrammeEvents());
  return (
    <div className="page-wrap">
      <section className="page-hero">
        <p className="eyebrow">{programme.editorial.kicker}</p>
        <h1>{programme.editorial.headline}</h1>
        <p>{programme.editorial.body}</p>
      </section>
      <section className="section-block">
        <LiveMatchList initialProgramme={programme} />
      </section>
    </div>
  );
}
