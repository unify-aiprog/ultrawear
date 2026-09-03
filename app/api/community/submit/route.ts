import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { saveSubmission } from '@/lib/community/store';
import { getSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function authenticatedUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const supabase = getSupabaseServerClient();
  if (!token || !supabase) return null;
  const { data } = await supabase.auth.getUser(token);
  return data.user ?? null;
}

export async function POST(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  try {
    const body = await request.json();
    const text = typeof body?.body === 'string' ? body.body.trim() : '';
    if (!text || text.length > 5000) return NextResponse.json({ error: 'A valid body is required' }, { status: 400 });
    const submission = await saveSubmission({ id: randomUUID(), authorId: user.id, body: text, status: 'pending', createdAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, submission: { id: submission.id, status: submission.status } }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Submission failed' }, { status: 503 });
  }
}
