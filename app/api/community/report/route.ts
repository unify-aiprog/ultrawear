import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getServerSportsIdentity } from '@/lib/identity/server-identity';
import { getSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
const schema = z.object({ targetType: z.enum(['post', 'comment']), targetId: z.string().min(1).max(160), reason: z.enum(['spam', 'harassment', 'hate', 'misinformation', 'other']), details: z.string().trim().max(500).optional() }).strict();

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid report' }, { status: 400 });
  const identity = await getServerSportsIdentity();
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from('community_reports').insert({ id: `report_${randomUUID().replaceAll('-', '')}`, reporter_id: identity.id, ...parsed.data });
    if (error) return NextResponse.json({ ok: false, error: 'Unable to submit report' }, { status: 503 });
  }
  return NextResponse.json({ ok: true, accepted: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
}
