import { NextResponse } from 'next/server';
import { advanceStory } from '@/content-core/editorial-service';
import { saveStory } from '@/content-core/store';
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
      const story = await saveStory({ ...body.story, author: body.story.author ?? user.id, editor: user.id });
      return NextResponse.json({ ok: true, story }, { status: 201 });
    }
    if (body?.action === 'advance') {
      if (!body.story || typeof body.to !== 'string') return NextResponse.json({ error: 'story and target state are required' }, { status: 400 });
      const result = await advanceStory(body.story, body.to, { actor: user.id, reason: typeof body.reason === 'string' ? body.reason : '', researchPack: body.researchPack ?? null });
      return NextResponse.json({ ok: true, story: result.story, audit: result.audit });
    }
    return NextResponse.json({ error: 'Unsupported editorial action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Editorial operation failed' }, { status: 422 });
  }
}
