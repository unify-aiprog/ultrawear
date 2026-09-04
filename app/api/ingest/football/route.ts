import { type NextRequest, NextResponse } from 'next/server';
import { ingestFootballCatalogue } from '@/lib/ingest/football-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.FOOTBALL_DATA_INGEST_SECRET;
  const suppliedSecret = request.headers.get('x-ingest-secret');
  if (!configuredSecret || suppliedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await ingestFootballCatalogue();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Football ingestion failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
