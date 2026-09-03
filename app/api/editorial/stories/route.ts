import { NextResponse } from 'next/server';
import { advanceStory } from '@/content-core/editorial-service';
import { getStory, saveStory } from '@/content-core/store';
import { getSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function authenticatedEditor(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const supabase = getSupabaseServerClient();
  if (!token || !supabase) return null;
  const { data } = await supabase.auth.getUser(token);
  const user = data.user;
  if (!user) return null;
  const role = user.app_metadata?.role;
  if (role !== 'editor' && role !== 'admin') return null;
  return user;
}

export async function POST(request: Request) {
  const user = await authenticatedEditor(request);
  if (!user) return NextResponse.json({ error: 'Editorial authentication required' }, { status: 401 });
  try {
    const body = await request.json();
    if (body?.action === 'create') {
      if (!body.story || typeof body.story !== 'object') return NextResponse.json({ error: 'story is required' }, { status: 400 });
      const storyInput = { ...body.story, state: 'opportunity', author: body.story.author ?? user.id, editor: user.id, publishedAt: null };
      const story = await saveStory(storyInput);
      return NextResponse.json({ ok: true, story }, { status: 201 });
    }
    if (body?.action === 'advance') {
      const storyId = typeof body.storyId === 'string' ? body.storyId.trim() : '';
      const to = typeof body.to === 'string' ? body.to : '';
      if (!storyId || !to) return NextResponse.json({ error: 'storyId and target state are required' }, { status: 400 });
      const story = await getStory(storyId);
      if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      const result = await advanceStory(story, to, {
        actor: user.id,
        reason: typeof body.reason === 'string' ? body.reason : '',
        researchPack: body.researchPack ?? null,
      });
      return NextResponse.json({ ok: true, story: result.story, audit: result.audit });
    }
    return NextResponse.json({ error: 'Unsupported editorial action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Editorial operation failed' }, { status: 422 });
  }
}
