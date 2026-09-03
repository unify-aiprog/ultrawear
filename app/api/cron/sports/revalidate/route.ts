import { NextResponse } from 'next/server';
import { revalidateSports, footballMatchAdapter } from '@/lib/ingest/revalidation';

export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const expected = process.env.SPORTS_REVALIDATION_CRON_SECRET;
  if (!expected) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await revalidateSports(footballMatchAdapter);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Revalidation failed' }, { status: 503 });
  }
}
