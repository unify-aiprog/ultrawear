import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getServerSportsIdentity } from '@/lib/identity/server-identity';
import { getSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
const schema = z.object({ postId: z.string().min(1).max(160), body: z.string().trim().min(1).max(1000) }).strict();

export async function GET(request: Request) {
  const postId = new URL(request.url).searchParams.get('postId');
  if (!postId || postId.length > 160) return NextResponse.json({ ok: false, error: 'Invalid post' }, { status: 400 });
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: true, comments: [] }, { headers: { 'Cache-Control': 'private, no-store' } });
  const { data, error } = await supabase.from('community_comments').select('id,post_id,author_id,body,created_at').eq('post_id', postId).eq('status', 'published').order('created_at', { ascending: true }).limit(100);
  if (error) return NextResponse.json({ ok: false, error: 'Unable to load comments' }, { status: 503 });
  return NextResponse.json({ ok: true, comments: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid comment' }, { status: 400 });
  const identity = await getServerSportsIdentity();
  const comment = { id: `comment_${randomUUID().replaceAll('-', '')}`, postId: parsed.data.postId, authorId: identity.id, body: parsed.data.body, createdAt: new Date().toISOString() };
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from('community_comments').insert({ id: comment.id, post_id: comment.postId, author_id: comment.authorId, body: comment.body });
    if (error) return NextResponse.json({ ok: false, error: 'Unable to create comment' }, { status: 503 });
  }
  return NextResponse.json({ ok: true, comment }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}
