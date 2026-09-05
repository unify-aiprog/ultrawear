import { NextResponse } from 'next/server';
import { getStoredProgramme, isProgrammeStale } from '@/lib/sports/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const stored = await getStoredProgramme();
  if (!stored) {
    return NextResponse.json({ ok: false, status: 'unavailable', persisted: false, stale: true, updatedAt: null, sourceHealth: [] }, { status: 503 });
  }

  const stale = isProgrammeStale(stored.updatedAt);
  const hasDownProvider = stored.sourceHealth.some((provider) => provider.status === 'down');
  const status = stale ? 'stale' : hasDownProvider ? 'degraded' : 'healthy';

  return NextResponse.json({
    ok: !stale,
    status,
    persisted: true,
    stale,
    updatedAt: stored.updatedAt,
    sourceHealth: stored.sourceHealth,
  });
}
