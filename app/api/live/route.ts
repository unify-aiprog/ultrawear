import { NextResponse } from 'next/server';
import { getProgrammeEvents, ingestFootballLive } from '@/lib/ingest/football-live';
import { buildProgramme } from '@/lib/sports-brain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let feedError = false;
  try { await ingestFootballLive(); } catch { feedError = true; }
  const events = await getProgrammeEvents();
  const programme = buildProgramme(events);
  return NextResponse.json({ updatedAt: programme.generatedAt, programme, feedError }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
