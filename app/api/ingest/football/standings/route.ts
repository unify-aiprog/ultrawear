import { NextRequest, NextResponse } from 'next/server';
import { ingestFootballStandings } from '@/lib/ingest/football-standings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = process.env.FOOTBALL_DATA_INGEST_SECRET;
  if (!secret || request.headers.get('x-ingest-secret') !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const configured = process.env.FOOTBALL_DATA_STANDINGS_CODES?.split(',').map((value) => value.trim()).filter(Boolean) ?? [];
    if (!configured.length) return NextResponse.json({ error: 'No competition codes configured' }, { status: 400 });
    return NextResponse.json({ ok: true, result: await ingestFootballStandings(configured) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Standings ingestion failed' }, { status: 500 });
  }
}
