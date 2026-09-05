import type { Metadata } from 'next';
import { getStoredProgramme } from '@/lib/sports/engine';
import { LiveMatchList } from '@/components/live-match-list';
import type { SportsProgramme } from '@/lib/sports/programme';

export const metadata: Metadata = {
  title: 'Live Sport | UltraWear FC',
  description: 'The live sports programme: what is happening now, what is next and what matters.',
};

const emptyProgramme: SportsProgramme = {
  generatedAt: new Date(0).toISOString(), sport: 'all', lead: null, now: [], next: [], tonight: [], tomorrow: [], thisWeekend: [], recent: [],
  sourceHealth: { healthy: 0, degraded: 0, down: 0, notConfigured: 0 },
  editorial: { kicker: 'THE PROGRAMME', headline: 'Stay close to sport.', body: 'The live programme is waiting for its first verified refresh.' },
};

export default async function LivePage() {
  const stored = await getStoredProgramme();
  const programme = (stored?.programme ?? emptyProgramme) as SportsProgramme;
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
