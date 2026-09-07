import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCommunityPost, listCommunityPosts } from '@/lib/community/server-community';

export const dynamic = 'force-dynamic';
const schema = z.object({ community: z.string().trim().min(1).max(80), body: z.string().trim().min(1).max(2_000) }).strict();

export async function GET(request: Request) {
  const community = new URL(request.url).searchParams.get('community') || undefined;
  return NextResponse.json({ ok: true, posts: await listCommunityPosts(community) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid community post' }, { status: 400 });
  return NextResponse.json({ ok: true, post: await createCommunityPost(parsed.data.community, parsed.data.body) }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}
