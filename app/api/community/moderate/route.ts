import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { moderateAndSave } from '@/lib/community/store';
import type { CommunitySubmission, ModerationStatus } from '@/lib/community/moderation';

export const dynamic = 'force-dynamic';

const MODERATOR_ROLES = new Set(['admin', 'moderator', 'editor']);

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const role = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : '';
  if (!MODERATOR_ROLES.has(role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 });
  try {
    const body = await request.json();
    if (!body?.submission || typeof body.to !== 'string') return NextResponse.json({ error: 'submission and target status are required' }, { status: 400 });
    const result = await moderateAndSave(body.submission as CommunitySubmission, body.to as ModerationStatus, user.id, typeof body.reason === 'string' ? body.reason : '');
    return NextResponse.json({ ok: true, submission: result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Moderation failed' }, { status: 422 });
  }
}
