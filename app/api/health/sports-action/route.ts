import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUIRED_SPORTS = ['football', 'tennis', 'basketball', 'athletics', 'motorsport'];

export async function GET() {
  const checkedAt = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        status: 'down',
        checkedAt,
        missingSports: REQUIRED_SPORTS,
        compliance: { violations: 0 },
      },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from('sports_brain_events')
    .select('sport')
    .gte('starts_at', new Date(Date.now() - 12 * 60 * 60_000).toISOString())
    .limit(5000);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        status: 'down',
        checkedAt,
        missingSports: REQUIRED_SPORTS,
        compliance: { violations: 0 },
        reason: error.message,
      },
      { status: 503 },
    );
  }

  const available = new Set((data ?? []).map((row) => row.sport).filter(Boolean));
  const missingSports = REQUIRED_SPORTS.filter((sport) => !available.has(sport));
  const status = missingSports.length === 0 ? 'ready' : missingSports.length < REQUIRED_SPORTS.length ? 'degraded' : 'down';

  return NextResponse.json(
    {
      ok: status !== 'down',
      status,
      checkedAt,
      missingSports,
      compliance: { violations: 0 },
    },
    { status: status === 'down' ? 503 : 200 },
  );
}
