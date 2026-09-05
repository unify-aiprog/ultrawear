import { NextResponse } from 'next/server';
import { getStoredProgramme, isProgrammeStale } from '@/lib/sports/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const stored = await getStoredProgramme();

  if (!stored) {
    return NextResponse.json(
      {
        updatedAt: null,
        programme: null,
        feedError: true,
        persisted: false,
        stale: true,
        reason: 'No persisted Sports Brain programme is available yet.',
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      },
    );
  }

  const stale = isProgrammeStale(stored.updatedAt);
  return NextResponse.json(
    {
      updatedAt: stored.updatedAt,
      programme: stored.programme,
      feedError: false,
      persisted: true,
      stale,
      sourceHealth: stored.sourceHealth,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
