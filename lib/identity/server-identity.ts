import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { SportsIdentity, SportsInterest } from '@/lib/identity/sports-identity';

const COOKIE = 'uw-fan-id';
const memory = new Map<string, SportsIdentity>();

function createIdentity(id: string): SportsIdentity {
  const suffix = id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toLowerCase() || randomUUID().slice(0, 8);
  return { id, handle: `fan_${suffix}`, displayName: 'New Fan', interests: ['football'], followedTeams: [], followedAthletes: [], followedCommunities: [], xp: 0, level: 1, streak: 0, participations: 0, badges: ['FIRST SIGNAL'], createdAt: new Date().toISOString() };
}

async function fanId() {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing && /^[a-zA-Z0-9_-]{20,80}$/.test(existing)) return existing;
  const id = `fan_${randomUUID().replaceAll('-', '')}`;
  store.set(COOKIE, id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 * 2 });
  return id;
}

export async function getServerSportsIdentity(): Promise<SportsIdentity> {
  const id = await fanId();
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.from('sports_identities').select('*').eq('id', id).maybeSingle();
    if (data) return rowToIdentity(data);
  }
  const existing = memory.get(id);
  if (existing) return existing;
  const identity = createIdentity(id);
  memory.set(id, identity);
  return identity;
}

export async function saveServerSportsIdentity(identity: SportsIdentity) {
  const id = await fanId();
  const next = { ...identity, id };
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from('sports_identities').upsert({
      id, handle: next.handle, display_name: next.displayName, interests: next.interests,
      followed_teams: next.followedTeams, followed_athletes: next.followedAthletes,
      followed_communities: next.followedCommunities, xp: next.xp, level: next.level,
      streak: next.streak, participations: next.participations,
      last_participation_at: next.lastParticipationAt ?? null, badges: next.badges,
      created_at: next.createdAt, updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (!error) return next;
  }
  memory.set(id, next);
  return next;
}

function rowToIdentity(row: Record<string, unknown>): SportsIdentity {
  return {
    id: String(row.id), handle: String(row.handle), displayName: String(row.display_name),
    interests: (row.interests as SportsInterest[]) ?? ['football'],
    followedTeams: (row.followed_teams as string[]) ?? [], followedAthletes: (row.followed_athletes as string[]) ?? [],
    followedCommunities: (row.followed_communities as string[]) ?? [], xp: Number(row.xp ?? 0), level: Number(row.level ?? 1),
    streak: Number(row.streak ?? 0), participations: Number(row.participations ?? 0),
    lastParticipationAt: row.last_participation_at ? String(row.last_participation_at) : undefined,
    badges: (row.badges as string[]) ?? [], createdAt: String(row.created_at),
  };
}
