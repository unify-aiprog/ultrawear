import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const eventSchema = z.object({
  id: z.string().min(1),
  name: z.enum(['page_view', 'live_view', 'participation', 'quest_accept', 'community_post', 'community_reaction', 'interest_toggle', 'follow_toggle']),
  occurredAt: z.string().datetime(),
  anonymousId: z.string().min(1).max(128),
  properties: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid audience event' }, { status: 400 });
  return NextResponse.json({ ok: true, accepted: parsed.data.id }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
}
