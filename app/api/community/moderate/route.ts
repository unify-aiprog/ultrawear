import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSubmission, moderateAndSave } from '@/lib/community/store';
import type { ModerationStatus } from '@/lib/community/moderation';

export const dynamic = 'force-dynamic';
const MODERATOR_ROLES = new Set(['admin', 'moderator', 'editor']);
const MODERATION_STATUSES = new Set<ModerationStatus>(['pending', 'approved', 'rejected', 'removed', 'appeal']);

async function authenticatedModerator(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const supabase = getSupabaseServerClient();
  if (!token || !supabase) return null;
  const { data } = await supabase.auth.getUser(token);
  const user = data.user;
  if (!user) return null;
  const role = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : '';
  if (!MODERATOR_ROLES.has(role)) return null;
  return user;
}

export async function POST(request: Request) {
  const user = await authenticatedModerator(request);
  if (!user) return NextResponse.json({ error: 'Moderator authentication required' }, { status: 401 });

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
