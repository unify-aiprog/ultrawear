import { NextResponse } from 'next/server';
import { getServerSportsIdentity } from '@/lib/identity/server-identity';
import { recommendDiscovery } from '@/lib/recommendations/discovery';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const identity = await getServerSportsIdentity();
  const requested = Number(new URL(request.url).searchParams.get('limit') || 3);
  const limit = Number.isFinite(requested) ? Math.min(8, Math.max(1, Math.floor(requested))) : 3;
  const recommendations = recommendDiscovery(identity.interests, limit);
  return NextResponse.json({ ok: true, recommendations }, { headers: { 'Cache-Control': 'private, no-store' } });
}
