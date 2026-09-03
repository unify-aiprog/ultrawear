import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { cacheGet } from '@/lib/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STALE_AFTER_MINUTES = 15;
const LIVE_STALE_AFTER_MINUTES = 10;

function ageInMinutes(timestamp: string | null, now: number) {
  if (!timestamp) return null;
  const value = new Date(timestamp).getTime();
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.round((now - value) / 60000));
}

export async function GET() {
  const checkedAt = new Date();
  const now = checkedAt.getTime();
  const checks = {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    footballData: Boolean(process.env.FOOTBALL_DATA_API_TOKEN),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    ingestSecret: Boolean(process.env.FOOTBALL_DATA_INGEST_SECRET),
  };

  const supabase = getSupabaseServerClient();
  let database = false;
  let lastEventAt: string | null = null;
  let lastLiveAt: string | null = null;
  let cacheWarm = false;

  if (supabase) {
    const [dbResult, eventResult, liveResult, cacheResult] = await Promise.all([
      supabase.from('sports').select('id').limit(1),
      supabase.from('events_v2').select('updated_at').order('updated_at', { ascending: false }).limit(1),
      supabase.from('events_v2').select('updated_at').in('status', ['IN_PLAY', 'PAUSED']).order('updated_at', { ascending: false }).limit(1),
      cacheGet<unknown>('ultrawear:football:live:v1'),
    ]);
    database = !dbResult.error;
    lastEventAt = eventResult.data?.[0]?.updated_at ?? null;
    lastLiveAt = liveResult.data?.[0]?.updated_at ?? null;
    cacheWarm = cacheResult !== null;
  }

  const eventAgeMinutes = ageInMinutes(lastEventAt, now);
  const liveAgeMinutes = ageInMinutes(lastLiveAt, now);
  const staleEvents = eventAgeMinutes === null || eventAgeMinutes > STALE_AFTER_MINUTES;
  const staleLive = liveAgeMinutes !== null && liveAgeMinutes > LIVE_STALE_AFTER_MINUTES;
  const configOk = Object.values(checks).every(Boolean);
  const coreOk = checks.supabase && database;
  const degraded = !configOk || !coreOk || staleEvents || staleLive;
  const status = !coreOk ? 'down' : degraded ? 'degraded' : 'healthy';
  const ok = status === 'healthy';

  return NextResponse.json(
    {
      ok,
      status,
      checkedAt: checkedAt.toISOString(),
      checks: { ...checks, database, liveCache: cacheWarm },
      sync: {
        lastEventAt,
        lastLiveAt,
        eventAgeMinutes,
        liveAgeMinutes,
        staleEvents,
        staleLive,
      },
      thresholds: {
        staleEventsMinutes: STALE_AFTER_MINUTES,
        staleLiveMinutes: LIVE_STALE_AFTER_MINUTES,
      },
    },
    { status: ok ? 200 : 503 },
  );
}
