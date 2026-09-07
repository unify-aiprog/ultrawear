import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSportsIdentity, saveServerSportsIdentity } from '@/lib/identity/server-identity';

export const dynamic = 'force-dynamic';

const schema = z.object({
  id: z.string().min(1).max(160),
  eventId: z.string().min(1).max(160),
  actionId: z.string().min(1).max(160),
  kind: z.enum(['prediction', 'poll', 'reaction', 'quest']),
  points: z.number().int().min(0).max(100),
}).strict();

function nextStreak(last: string | undefined, now: Date, current: number) {
  if (!last) return 1;
  const previous = new Date(last);
  const day = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const delta = Math.round((day(now) - day(previous)) / 86_400_000);
  if (delta === 0) return Math.max(1, current);
  if (delta === 1) return current + 1;
  return 1;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid participation' }, { status: 400 });

  const identity = await getServerSportsIdentity();
  const now = new Date();
  const xp = identity.xp + parsed.data.points;
  const participations = identity.participations + 1;
  const streak = nextStreak(identity.lastParticipationAt, now, identity.streak);
  const badges = [...identity.badges];
  if (participations >= 10 && !badges.includes('IN THE MIX')) badges.push('IN THE MIX');
  if (streak >= 7 && !badges.includes('SEVEN DAY SIGNAL')) badges.push('SEVEN DAY SIGNAL');

  const updated = await saveServerSportsIdentity({
    ...identity, xp, level: Math.floor(xp / 100) + 1, streak, participations,
    lastParticipationAt: now.toISOString(), badges,
  });
  return NextResponse.json({ ok: true, identity: updated, participation: parsed.data }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}
