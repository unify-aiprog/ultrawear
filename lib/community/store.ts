import { getSupabaseAdminClient } from '@/lib/supabase';
import { moderateSubmission, type CommunitySubmission, type ModerationStatus } from './moderation';

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

export async function moderateAndSave(item: CommunitySubmission, to: ModerationStatus, moderatorId: string, reason = '') {
  const updated = moderateSubmission(item, to, moderatorId, reason);
  await saveSubmission(updated);
  const { error } = await db().from('community_moderation_audit').insert({
    submission_id: item.id, from_status: item.status, to_status: updated.status,
    moderator_id: moderatorId, reason,
  });
  if (error) throw new Error(`Unable to persist moderation audit: ${error.message}`);
  return updated;
}
