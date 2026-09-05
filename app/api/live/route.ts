import { NextResponse } from 'next/server';
import { getStoredProgramme } from '@/lib/sports/engine';
import { getProgrammeEvents } from '@/lib/ingest/football-live';
import { buildSportsProgramme } from '@/lib/sports/programme';
import type { NormalizedSportsEvent } from '@/lib/sports/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeFootballEvents(events: Awaited<ReturnType<typeof getProgrammeEvents>>): NormalizedSportsEvent[] {
  return events.map((event) => ({
    id: event.id,
    sport: 'football',
    startsAt: event.starts_at,
    status: event.status as NormalizedSportsEvent['status'],
    competition: event.competition,
    home: { id: `${event.id}:home`, name: event.home_team.name, imageUrl: event.home_team.crest_url },
    away: { id: `${event.id}:away`, name: event.away_team.name, imageUrl: event.away_team.crest_url },
    homeScore: event.home_score,
    awayScore: event.away_score,
    provider: 'events_v2',
    providerId: event.id,
  }));
}

export async function GET() {
  const stored = await getStoredProgramme();
  if (stored) {
    return NextResponse.json({ updatedAt: stored.updatedAt, programme: stored.programme, feedError: false, persisted: true }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  }
  const fallbackEvents = normalizeFootballEvents(await getProgrammeEvents());
  const fallback = buildSportsProgramme(fallbackEvents);
  return NextResponse.json({ updatedAt: fallback.generatedAt, programme: fallback, feedError: true, persisted: false }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
