import { NextResponse } from 'next/server';
import { getLiveEvents } from '@/lib/ingest/football-live';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const events = await getLiveEvents();
  return NextResponse.json({ updatedAt: new Date().toISOString(), events }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
