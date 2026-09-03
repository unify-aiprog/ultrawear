import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    footballData: Boolean(process.env.FOOTBALL_DATA_API_TOKEN),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  };
  const supabase = getSupabaseServerClient();
  let database = false;
  if (supabase) {
    const { error } = await supabase.from('sports').select('id').limit(1);
    database = !error;
  }
  const ok = checks.supabase && checks.footballData && checks.siteUrl && database;
  return NextResponse.json({ ok, checks: { ...checks, database } }, { status: ok ? 200 : 503 });
}
