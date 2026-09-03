import { getSupabaseAdminClient } from '../lib/supabase.js';
import { createStory } from './contracts.js';

function db() {
  const client = getSupabaseAdminClient();
  if (!client) throw new Error('Supabase service role is not configured');
  return client;
}

export async function saveStory(input) {
  const story = createStory(input);
  const { data, error } = await db().from('content_stories').upsert({
    id: story.id, type: story.type, title: story.title, canonical_slug: story.canonicalSlug,
    summary: story.summary, state: story.state, signal_ids: story.signalIds, entities: story.entities,
    evidence: story.evidence, author: story.author, editor: story.editor,
    published_at: story.publishedAt, updated_at: story.updatedAt ?? new Date().toISOString(),
  }, { onConflict: 'id' }).select('*').single();
  if (error || !data) throw new Error(`Unable to persist story: ${error?.message ?? 'unknown error'}`);
  return story;
}

export async function appendStoryAudit({ storyId, action, actor, reason = '', fromState = null, toState = null, metadata = {} }) {
  const { error } = await db().from('content_audit_log').insert({ story_id: storyId, action, actor, reason, from_state: fromState, to_state: toState, metadata });
  if (error) throw new Error(`Unable to persist content audit event: ${error.message}`);
}

export async function listReviewQueue(limit = 50) {
  const { data, error } = await db().from('content_stories').select('*').eq('state', 'review').order('updated_at', { ascending: true }).limit(limit);
  if (error) throw new Error(`Unable to load editorial review queue: ${error.message}`);
  return data ?? [];
}
