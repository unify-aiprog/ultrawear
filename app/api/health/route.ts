import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getStoredProgramme, isProgrammeStale } from '@/lib/sports/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checkedAt = new Date();
  const now = checkedAt.getTime();
  const checks = {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    footballData: Boolean(process.env.FOOTBALL_DATA_API_TOKEN),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  };

  const supabase = getSupabaseServerClient();
  const database = Boolean(supabase);
  const stored = await getStoredProgramme();
  const programmeAgeMinutes = stored ? Math.max(0, Math.round((now - Date.parse(stored.updatedAt)) / 60_000)) : null;
  const programmeStale = stored ? isProgrammeStale(stored.updatedAt, now) : true;
  const providerHealth = stored?.sourceHealth ?? [];
  const providerDown = providerHealth.some((provider) => provider.status === 'down');
  const configOk = Object.values(checks).every(Boolean);
  const coreOk = database && Boolean(stored);
  const degraded = !configOk || !coreOk || programmeStale || providerDown;
  const status = !coreOk ? 'down' : degraded ? 'degraded' : 'healthy';
  const ok = status === 'healthy';

  return NextResponse.json(
    {
      ok,
      status,
      checkedAt: checkedAt.toISOString(),
      checks: { ...checks, database, programmePersisted: Boolean(stored) },
      sportsBrain: { updatedAt: stored?.updatedAt ?? null, programmeAgeMinutes, programmeStale, providerHealth },
    },
    { status: ok ? 200 : 503 },
  );
}
