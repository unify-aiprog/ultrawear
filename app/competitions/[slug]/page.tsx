import type { Metadata } from 'next';
import { getCompetition } from '@/lib/data';
import { AdSlot } from '@/components/ad-slot';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCompetition(slug);
  return { title: competition?.name || 'Competition' };
}

export default async function CompetitionPage({ params }: Props) {
  const { slug } = await params;
  const competition = await getCompetition(slug);
  if (!competition) return <section className="section"><h1>Competition not found.</h1><p className="empty-state">The requested competition is not currently available in the data layer.</p></section>;
  return <section className="section"><p className="eyebrow">{competition.sport} · {competition.country || 'Worldwide'}</p><h1 className="page-title">{competition.name}</h1><p className="lede dark">Fixtures, results and tables for {competition.name}. Editorial depth is concentrated on the launch target leagues; this page remains a durable worldwide data surface.</p><AdSlot minHeight={250}/><div className="empty-state">Fixtures, results and standings components will consume the shared data layer in the next vertical slice.</div></section>;
}
