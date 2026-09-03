import { getSupabaseAdminClient } from '../lib/supabase.js';
import { createStory } from './contracts.js';

function db() {
  const client = getSupabaseAdminClient();
  if (!client) throw new Error('Supabase service role is not configured');
  return client;
}

function rowToStory(row) {
  return createStory({
    id: row.id, type: row.type, title: row.title, canonicalSlug: row.canonical_slug,
    summary: row.summary ?? '', state: row.state, signalIds: row.signal_ids ?? [],
    entities: row.entities ?? [], evidence: row.evidence ?? [], author: row.author ?? null,
    editor: row.editor ?? null, publishedAt: row.published_at ?? null, updatedAt: row.updated_at ?? null,
  });
}

export async function saveStory(input) {
  const story = createStory(input);
  if (story.state === 'approved' || story.state === 'published') {
    throw new Error('Approved and published stories must use the editorial transition gate');
  }
  const { data, error } = await db().from('content_stories').upsert({
    id: story.id, type: story.type, title: story.title, canonical_slug: story.canonicalSlug,
    summary: story.summary, state: story.state, signal_ids: story.signalIds, entities: story.entities,
    evidence: story.evidence, author: story.author, editor: story.editor,
    published_at: story.publishedAt, updated_at: story.updatedAt ?? new Date().toISOString(),
  }, { onConflict: 'id' }).select('*').single();
  if (error || !data) throw new Error(`Unable to persist story: ${error?.message ?? 'unknown error'}`);
  return rowToStory(data);
}

export async function getStory(id) {
  if (!id) throw new Error('Story id is required');
  const { data, error } = await db().from('content_stories').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Unable to load story: ${error.message}`);
  return data ? rowToStory(data) : null;
}

export async function transitionStoryAtomically({ storyId, toState, actor, reason = '', publishedAt = null }) {
  if (!storyId || !toState || !actor) throw new Error('Story id, target state, and actor are required');
  const { data, error } = await db().rpc('transition_content_story', {
    p_story_id: storyId, p_to_state: toState, p_actor: actor, p_reason: reason, p_published_at: publishedAt,
  });
  if (error || !data) throw new Error(`Unable to persist editorial transition: ${error?.message ?? 'unknown error'}`);
  return rowToStory(data);
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
