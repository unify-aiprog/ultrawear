import { getStoredProgramme } from '@/lib/sports/engine';
import { liveExperiences } from '@/lib/sports/simulator';
import type { NormalizedSportsStatus } from '@/lib/sports/types';

// The events the server is currently presenting, keyed by id. Participation is only
// valid for events the server actually serves, so a client cannot farm XP by posting
// arbitrary event ids (the ledger uniqueness is per identity/event/action).
export async function getActiveEvents(): Promise<Map<string, NormalizedSportsStatus>> {
  const stored = await getStoredProgramme();
  if (stored?.programme) {
    const programme = stored.programme;
    const events = [...programme.now, ...programme.next, ...programme.tonight, ...programme.tomorrow, ...programme.thisWeekend, ...programme.recent];
    return new Map(events.map((event) => [event.id, event.status]));
  }
  // No durable programme: the served surface is the labelled simulator demo.
  return new Map(liveExperiences().map(({ event }) => [event.id, event.status === 'live' ? 'IN_PLAY' : 'FINISHED']));
}
