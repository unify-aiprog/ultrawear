import { NextResponse } from 'next/server';
import { z } from 'zod';
import { appendAudienceEvent } from '@/lib/analytics/audience-store';

export const dynamic = 'force-dynamic';

const propertyValue = z.union([z.string().max(500), z.number().finite(), z.boolean()]);
const eventSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.enum(['page_view', 'live_view', 'participation', 'quest_accept', 'community_post', 'community_reaction', 'interest_toggle', 'follow_toggle']),
  occurredAt: z.string().datetime(),
  anonymousId: z.string().min(1).max(128),
  properties: z.record(z.string(), propertyValue).default({}),
}).superRefine((event, ctx) => {
  if (Object.keys(event.properties).length > 30) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Too many event properties', path: ['properties'] });
  }
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid audience event' }, { status: 400 });

  const result = await appendAudienceEvent(parsed.data);
  return NextResponse.json(
    { ok: true, accepted: parsed.data.id, persisted: result.persisted },
    { status: 202, headers: { 'Cache-Control': 'no-store' } },
  );
}
