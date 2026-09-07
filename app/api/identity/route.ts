import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSportsIdentity, saveServerSportsIdentity } from '@/lib/identity/server-identity';

export const dynamic = 'force-dynamic';

const interest = z.enum(['football', 'basketball', 'athletics', 'tennis', 'motorsport', 'womens-sport', 'emerging-sport']);
const patchSchema = z.object({
  displayName: z.string().trim().min(2).max(40).optional(),
  interests: z.array(interest).max(7).optional(),
  followedTeams: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
  followedAthletes: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
  followedCommunities: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
}).strict();

export async function GET() {
  const identity = await getServerSportsIdentity();
  return NextResponse.json({ ok: true, identity }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid identity update' }, { status: 400 });

  const current = await getServerSportsIdentity();
  const identity = await saveServerSportsIdentity({ ...current, ...parsed.data });
  return NextResponse.json({ ok: true, identity }, { headers: { 'Cache-Control': 'private, no-store' } });
}
