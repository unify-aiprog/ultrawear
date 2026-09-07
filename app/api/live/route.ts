import { NextResponse } from 'next/server';
import { getStoredProgramme, isProgrammeStale } from '@/lib/sports/engine';
import { buildSportsProgramme } from '@/lib/sports/programme';
import { liveExperiences } from '@/lib/sports/simulator';
import { isSportSlug } from '@/lib/sports/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stored = await getStoredProgramme();

  if (stored?.programme && !isProgrammeStale(stored.updatedAt)) {
    return NextResponse.json(
      {
        generatedAt: stored.updatedAt,
        mode: 'sports-brain',
        stale: false,
        programme: stored.programme,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (stored?.programme) {
    return NextResponse.json(
      {
        generatedAt: stored.updatedAt,
        mode: 'sports-brain-stale',
        stale: true,
        programme: stored.programme,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const experiences = liveExperiences();
  const programme = buildSportsProgramme(
    experiences.flatMap((experience) => {
      const sport = experience.event.sport;
      if (!isSportSlug(sport)) return [];
      return [{
        id: experience.event.id,
        sport,
        startsAt: experience.event.occurredAt,
        status: experience.event.status === 'live' ? 'IN_PLAY' as const : 'FINISHED' as const,
        competition: experience.event.competition,
        stage: null,
        home: experience.event.home ? { id: `${experience.event.id}:home`, name: experience.event.home } : undefined,
        away: experience.event.away ? { id: `${experience.event.id}:away`, name: experience.event.away } : undefined,
        participants: [],
        homeScore: experience.event.homeScore,
        awayScore: experience.event.awayScore,
        provider: 'UltraWear Demo Simulator',
        providerId: experience.event.id,
        updatedAt: experience.event.occurredAt,
      }];
    }),
    'all',
  );

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      mode: 'simulator-fallback',
      stale: false,
      programme,
      experiences,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
