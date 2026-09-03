import { NextRequest, NextResponse } from 'next/server';
import { ingestFootballLive } from '@/lib/ingest/football-live';
import { FootballDataError } from '@/lib/providers/football-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.FOOTBALL_DATA_INGEST_SECRET;
  const suppliedSecret = request.headers.get('x-ingest-secret');
  if (!configuredSecret || suppliedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await ingestFootballLive();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof FootballDataError) {
      const status = error.status === 429 ? 429 : error.retryable ? 503 : 502;
      return NextResponse.json({ ok: false, error: error.message, retryable: error.retryable }, { status });
    }
    const message = error instanceof Error ? error.message : 'Live ingestion failed';
    return NextResponse.json({ ok: false, error: message, retryable: false }, { status: 500 });
  }
}
