import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { saveSubmission } from '@/lib/community/store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authorId = typeof body?.authorId === 'string' ? body.authorId.trim() : '';
    const text = typeof body?.body === 'string' ? body.body.trim() : '';
    if (!authorId || !text || text.length > 5000) return NextResponse.json({ error: 'A valid authorId and body are required' }, { status: 400 });
    const submission = await saveSubmission({ id: randomUUID(), authorId, body: text, status: 'pending', createdAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, submission: { id: submission.id, status: submission.status } }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Submission failed' }, { status: 503 });
  }
}
