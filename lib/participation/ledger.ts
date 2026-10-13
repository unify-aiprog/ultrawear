import { createHash } from 'node:crypto';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { SportsIdentity } from '@/lib/identity/sports-identity';
import type { ParticipationKind } from './actions';

export type AwardOutcome =
  | { status: 'awarded'; identity: SportsIdentity }
  | { status: 'duplicate'; identity: SportsIdentity }
  | { status: 'unavailable' }
  | { status: 'failed' };

export type AwardInput = {
  identity: SportsIdentity;
  eventId: string;
  actionId: string;
  kind: ParticipationKind;
  points: number;
};

// Deterministic primary key derived from the identity/event/action triple. A retry of
// the same participation produces the same key, so the unique constraint makes the
// write idempotent without trusting any client-supplied record id.
export function ledgerId(identityId: string, eventId: string, actionId: string): string {
  return createHash('sha256').update(`${identityId}\u0000${eventId}\u0000${actionId}`).digest('hex');
}

// Persist a participation and apply its progression in one atomic database call.
// The insert collides on retry; the award RPC re-checks the ledger row before it
// mutates XP, so neither retries nor concurrent requests can double-count.
export async function awardParticipation(input: AwardInput): Promise<AwardOutcome> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { status: 'unavailable' };

  const recordId = ledgerId(input.identity.id, input.eventId, input.actionId);
  const { error: insertError } = await supabase.from('participation_records').insert({
    id: recordId,
    identity_id: input.identity.id,
    event_id: input.eventId,
    action_id: input.actionId,
    kind: input.kind,
    points: input.points,
  });

  if (insertError) {
    // 23505 = unique_violation: this participation was already recorded.
    if (insertError.code === '23505') return { status: 'duplicate', identity: input.identity };
    return { status: 'failed' };
  }

  const { data, error: awardError } = await supabase.rpc('award_participation', { p_record_id: recordId });
  if (awardError) {
    // Never leave a ledger row that awarded no progress; the client can retry cleanly.
    await supabase.from('participation_records').delete().eq('id', recordId);
    return { status: 'failed' };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { status: 'failed' };
  const applied = (row as { applied?: boolean }).applied;
  const identity = rowToIdentity(row as Record<string, unknown>);
  return applied ? { status: 'awarded', identity } : { status: 'duplicate', identity };
}

function rowToIdentity(row: Record<string, unknown>): SportsIdentity {
  return {
    id: String(row.id),
    handle: String(row.handle),
    displayName: String(row.display_name),
    interests: (row.interests as SportsIdentity['interests']) ?? ['football'],
    followedTeams: (row.followed_teams as string[]) ?? [],
    followedAthletes: (row.followed_athletes as string[]) ?? [],
    followedCommunities: (row.followed_communities as string[]) ?? [],
    xp: Number(row.xp ?? 0),
    level: Number(row.level ?? 1),
    streak: Number(row.streak ?? 0),
    participations: Number(row.participations ?? 0),
    lastParticipationAt: row.last_participation_at ? String(row.last_participation_at) : undefined,
    badges: (row.badges as string[]) ?? [],
    createdAt: String(row.created_at),
  };
}
