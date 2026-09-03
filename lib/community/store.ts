import { getSupabaseAdminClient } from '@/lib/supabase';
import { type CommunitySubmission, type ModerationStatus } from './moderation';

function db() {
  const client = getSupabaseAdminClient();
  if (!client) throw new Error('Supabase service role is not configured');
  return client;
}

export async function saveSubmission(item: CommunitySubmission) {
  const { data, error } = await db().from('community_submissions').upsert({
    id: item.id, author_id: item.authorId, body: item.body, status: item.status,
    created_at: item.createdAt, moderated_at: item.moderatedAt ?? null,
    moderator_id: item.moderatorId ?? null, reason: item.reason ?? '',
  }, { onConflict: 'id' }).select('*').single();
  if (error || !data) throw new Error(`Unable to persist community submission: ${error?.message ?? 'unknown error'}`);
  return data;
}

function rowToSubmission(row: Record<string, unknown>): CommunitySubmission {
  return {
    id: String(row.id),
    authorId: String(row.author_id),
    body: String(row.body),
    status: row.status as ModerationStatus,
    createdAt: String(row.created_at),
    moderatedAt: row.moderated_at ? String(row.moderated_at) : undefined,
    moderatorId: row.moderator_id ? String(row.moderator_id) : undefined,
    reason: String(row.reason ?? ''),
  };
}

export async function getSubmission(id: string) {
  if (!id) throw new Error('Submission id is required');
  const { data, error } = await db().from('community_submissions').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Unable to load community submission: ${error.message}`);
  return data ? rowToSubmission(data) : null;
}

export async function moderateAndSave(item: CommunitySubmission, to: ModerationStatus, moderatorId: string, reason = '') {
  if (!moderatorId) throw new Error('Moderator id is required');
  const { data, error } = await db().rpc('moderate_community_submission', {
    p_submission_id: item.id,
    p_to_status: to,
    p_moderator_id: moderatorId,
    p_reason: reason,
  });
  if (error || !data) throw new Error(`Unable to persist moderation transaction: ${error?.message ?? 'unknown error'}`);
  return rowToSubmission(data as Record<string, unknown>);
}
