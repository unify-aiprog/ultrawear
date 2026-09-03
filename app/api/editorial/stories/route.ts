import { NextResponse } from 'next/server';
import { advanceStory } from '@/content-core/editorial-service';
import { saveStory } from '@/content-core/store';

export const dynamic = 'force-dynamic';

function actor(request: Request) {
  const value = request.headers.get('x-editor-actor')?.trim();
  return value || null;
}

export async function POST(request: Request) {
  const editor = actor(request);
  if (!editor) return NextResponse.json({ error: 'Editorial authentication required' }, { status: 401 });
  try {
    const body = await request.json();
    if (body?.action === 'create') {
      const story = await saveStory({ ...body.story, author: body.story?.author ?? editor });
      return NextResponse.json({ ok: true, story }, { status: 201 });
    }
    if (body?.action === 'advance') {
      if (!body.story || typeof body.to !== 'string') return NextResponse.json({ error: 'story and target state are required' }, { status: 400 });
      const result = await advanceStory(body.story, body.to, { actor: editor, reason: typeof body.reason === 'string' ? body.reason : '', researchPack: body.researchPack ?? null });
      return NextResponse.json({ ok: true, story: result.story, audit: result.audit });
    }
    return NextResponse.json({ error: 'Unsupported editorial action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Editorial operation failed' }, { status: 422 });
  }
}
