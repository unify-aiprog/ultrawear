import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSubmission, moderateAndSave } from '@/lib/community/store';
import type { ModerationStatus } from '@/lib/community/moderation';

export const dynamic = 'force-dynamic';
const MODERATOR_ROLES = new Set(['admin', 'moderator', 'editor']);
const MODERATION_STATUSES = new Set<ModerationStatus>(['pending', 'approved', 'rejected', 'removed', 'appeal']);

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const role = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : '';
  if (!MODERATOR_ROLES.has(role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 });

  try {
    const body = await request.json();
    const submissionId = typeof body?.submissionId === 'string' ? body.submissionId.trim() : '';
    const to = typeof body?.to === 'string' ? body.to as ModerationStatus : null;
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
    if (!submissionId || !to || !MODERATION_STATUSES.has(to)) {
      return NextResponse.json({ error: 'submissionId and a valid target status are required' }, { status: 400 });
    }

    const item = await getSubmission(submissionId);
    if (!item) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    const result = await moderateAndSave(item, to, user.id, reason);
    return NextResponse.json({ ok: true, submission: result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Moderation failed' }, { status: 422 });
  }
}
