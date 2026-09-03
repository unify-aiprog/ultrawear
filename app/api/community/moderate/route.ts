import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase';
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
    const id = typeof body?.submissionId === 'string' ? body.submissionId : '';
    const to = typeof body?.to === 'string' ? body.to as ModerationStatus : null;
    if (!id || !to) return NextResponse.json({ error: 'submissionId and target status are required' }, { status: 400 });
    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: 'Persistence service unavailable' }, { status: 503 });
    const { data: row, error } = await admin.from('community_submissions').select('*').eq('id', id).single();
    if (error || !row) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    const item: CommunitySubmission = { id: row.id, authorId: row.author_id, body: row.body, status: row.status, createdAt: row.created_at, moderatedAt: row.moderated_at ?? undefined, moderatorId: row.moderator_id ?? undefined, reason: row.reason ?? '' };
    const result = await moderateAndSave(item, to, user.id, typeof body.reason === 'string' ? body.reason : '');
    return NextResponse.json({ ok: true, submission: result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Moderation failed' }, { status: 422 });
  }
}
