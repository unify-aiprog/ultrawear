import { randomUUID } from 'node:crypto';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getServerSportsIdentity } from '@/lib/identity/server-identity';

export type ServerCommunityPost = { id: string; authorId: string; authorHandle: string; community: string; body: string; createdAt: string; reactions: number };
const memoryPosts: ServerCommunityPost[] = [];

export async function listCommunityPosts(community?: string) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    let query = supabase.from('community_posts').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(50);
    if (community) query = query.eq('community', community);
    const { data } = await query;
    if (data) return data.map(rowToPost);
  }
  return memoryPosts.filter((post) => !community || post.community === community).slice(-50).reverse();
}

export async function createCommunityPost(community: string, body: string) {
  const identity = await getServerSportsIdentity();
  const post: ServerCommunityPost = { id: `post_${randomUUID().replaceAll('-', '')}`, authorId: identity.id, authorHandle: identity.handle, community, body, createdAt: new Date().toISOString(), reactions: 0 };
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from('community_posts').insert({ id: post.id, author_id: post.authorId, author_handle: post.authorHandle, community: post.community, body: post.body, status: 'published' });
    if (!error) return post;
  }
  memoryPosts.push(post);
  if (memoryPosts.length > 500) memoryPosts.splice(0, memoryPosts.length - 500);
  return post;
}

function rowToPost(row: Record<string, unknown>): ServerCommunityPost {
  return { id: String(row.id), authorId: String(row.author_id), authorHandle: String(row.author_handle), community: String(row.community), body: String(row.body), createdAt: String(row.created_at), reactions: Number(row.reactions ?? 0) };
}
