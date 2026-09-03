import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SPORTS = ['football', 'basketball', 'tennis', 'running'] as const;
const CANONICAL_STATUSES = new Set([
  'SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED', 'FINISHED', 'POSTPONED', 'SUSPENDED', 'CANCELLED',
]);

type Relation<T> = T | T[] | null;
type EventRow = {
  id: string;
  starts_at: string | null;
  status: string | null;
  provider_id: string | null;
  competitions_v2: Relation<{ sport_id: string | null }>;
  home_team: Relation<{ id: string }>;
  away_team: Relation<{ id: string }>;
};

function first<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function weekendBounds(now = new Date()) {
  const day = now.getUTCDay();
  const daysToSaturday = (6 - day + 7) % 7;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToSaturday));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 2);
  return { start, end };
}

export async function GET() {
  const checkedAt = new Date();
  const { start, end } = weekendBounds(checkedAt);
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, status: 'down', checkedAt: checkedAt.toISOString() }, { status: 503 });
  }

  const queryStarted = performance.now();
  const [sportsResult, eventsResult] = await Promise.all([
    supabase.from('sports').select('id').in('id', [...SPORTS]),
    supabase
      .from('events_v2')
      .select('id,starts_at,status,provider_id,competitions_v2!inner(sport_id),home_team:teams_v2!events_v2_home_team_id_fkey(id),away_team:teams_v2!events_v2_away_team_id_fkey(id)')
      .gte('starts_at', start.toISOString())
      .lt('starts_at', end.toISOString())
      .limit(500),
  ]);
  const queryMs = Math.round(performance.now() - queryStarted);

  if (sportsResult.error || eventsResult.error) {
    return NextResponse.json({
      ok: false,
      status: 'degraded',
      checkedAt: checkedAt.toISOString(),
      weekend: { start: start.toISOString(), end: end.toISOString() },
      queryMs,
      error: sportsResult.error?.message ?? eventsResult.error?.message ?? 'Weekend readiness query failed',
    }, { status: 503 });
  }

  const rows = (eventsResult.data ?? []) as unknown as EventRow[];
  const foundSports = new Set(rows.map((row) => first(row.competitions_v2)?.sport_id).filter((id): id is string => typeof id === 'string'));
  const missingSports = SPORTS.filter((sport) => !foundSports.has(sport));
  const perSport = Object.fromEntries(SPORTS.map((sport) => {
    const sportRows = rows.filter((row) => first(row.competitions_v2)?.sport_id === sport);
    return [sport, {
      events: sportRows.length,
      canonicalStatusViolations: sportRows.filter((row) => !CANONICAL_STATUSES.has(String(row.status ?? ''))).length,
      identityViolations: sportRows.filter((row) => !row.provider_id || !first(row.home_team)?.id || !first(row.away_team)?.id || !first(row.competitions_v2)?.sport_id).length,
    }];
  }));

  const violations = SPORTS.reduce((sum, sport) => {
    const item = perSport[sport] as { canonicalStatusViolations: number; identityViolations: number };
    return sum + item.canonicalStatusViolations + item.identityViolations;
  }, 0);
  const ready = violations === 0;

  return NextResponse.json({
    ok: ready,
    status: ready ? 'ready' : 'degraded',
    checkedAt: checkedAt.toISOString(),
    weekend: { start: start.toISOString(), end: end.toISOString() },
    queryMs,
    sports: perSport,
    missingSports,
    compliance: { violations, canonicalStatuses: [...CANONICAL_STATUSES] },
  }, { status: ready ? 200 : 503 });
}
