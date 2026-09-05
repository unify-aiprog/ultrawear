import { NextResponse } from 'next/server';
import { refreshSportsBrain } from '@/lib/sports/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const expected = process.env.SPORTS_BRAIN_CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await refreshSportsBrain();
    return NextResponse.json({ ok: true, updatedAt: result.programme.generatedAt, events: result.events, providers: result.providers });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Sports Brain refresh failed' }, { status: 503 });
  }
}
