import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSportsIdentity } from '@/lib/identity/server-identity';
import { actionAllowedForStatus, lookupAction } from '@/lib/participation/actions';
import { getActiveEvents } from '@/lib/participation/event-catalog';
import { awardParticipation } from '@/lib/participation/ledger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The browser may name an action, but it never decides the reward. Points and kind
// are resolved from the server catalog, so a client cannot inflate its own XP.
const schema = z.object({
  eventId: z.string().min(1).max(160),
  actionId: z.string().min(1).max(160),
}).strict();

const noStore = { 'Cache-Control': 'private, no-store' } as const;

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid participation' }, { status: 400 });

  const action = lookupAction(parsed.data.actionId);
  if (!action) return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });

  // The event must be one the server is currently presenting. Without this a client
  // could post arbitrary event ids and farm XP one ledger row at a time.
  const activeEvents = await getActiveEvents();
  const eventStatus = activeEvents.get(parsed.data.eventId);
  if (!eventStatus) return NextResponse.json({ ok: false, error: 'Unknown event' }, { status: 400 });
  if (!actionAllowedForStatus(action, eventStatus)) return NextResponse.json({ ok: false, error: 'Action not available for this event' }, { status: 400 });

  const identity = await getServerSportsIdentity();
  const outcome = await awardParticipation({
    identity,
    eventId: parsed.data.eventId,
    actionId: action.actionId,
    kind: action.kind,
    points: action.points,
  });

  const participation = { actionId: action.actionId, kind: action.kind, points: action.points };

  if (outcome.status === 'failed') {
    return NextResponse.json({ ok: false, error: 'Unable to record participation' }, { status: 503, headers: noStore });
  }
  if (outcome.status === 'duplicate') {
    return NextResponse.json({ ok: true, duplicate: true, identity: outcome.identity, participation }, { status: 200, headers: noStore });
  }
  if (outcome.status === 'awarded') {
    return NextResponse.json({ ok: true, identity: outcome.identity, participation }, { status: 201, headers: noStore });
  }

  // No durable store is configured (local/preview). Progression is preview-only and
  // must not be presented as a recorded, persistent participation.
  return NextResponse.json({ ok: true, preview: true, identity, participation }, { status: 200, headers: noStore });
}
