import { NextResponse } from 'next/server';
import { getStoredProgramme } from '@/lib/sports/engine';
import { getProgrammeEvents } from '@/lib/ingest/football-live';
import { buildProgramme } from '@/lib/sports-brain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const stored = await getStoredProgramme();
  if (stored) {
    return NextResponse.json({ updatedAt: stored.updatedAt, programme: stored.programme, feedError: false, persisted: true }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  }
  const fallback = buildProgramme(await getProgrammeEvents());
  return NextResponse.json({ updatedAt: fallback.generatedAt, programme: fallback, feedError: true, persisted: false }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
