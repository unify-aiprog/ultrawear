import { NextResponse } from 'next/server';
import { getStoredProgramme } from '@/lib/sports/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const stored = await getStoredProgramme();
  if (!stored) return NextResponse.json({ ok: false, status: 'down', reason: 'No persisted programme state', checkedAt: new Date().toISOString() }, { status: 503 });
  const ageMs = Date.now() - Date.parse(stored.updatedAt);
  const status = ageMs <= 10 * 60_000 ? 'healthy' : ageMs <= 30 * 60_000 ? 'degraded' : 'down';
  return NextResponse.json({ ok: status !== 'down', status, checkedAt: new Date().toISOString(), updatedAt: stored.updatedAt, ageMs, sourceHealth: stored.sourceHealth }, { status: status === 'down' ? 503 : 200 });
}
