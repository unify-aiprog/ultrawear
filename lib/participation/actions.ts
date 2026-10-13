import type { NormalizedSportsStatus } from '@/lib/sports/types';

export type ParticipationKind = 'prediction' | 'poll' | 'reaction' | 'quest';

export type ParticipationAction = {
  actionId: string;
  kind: ParticipationKind;
  label: string;
  points: number;
};

// Server-authoritative catalog. Reward points and action kinds are defined here,
// never supplied by the browser, so a client cannot inflate its own XP.
export const ACTION_CATALOG: Record<string, ParticipationAction> = {
  'pulse-live': { actionId: 'pulse-live', kind: 'reaction', label: 'JOIN THE PULSE', points: 10 },
  winner: { actionId: 'winner', kind: 'prediction', label: 'PICK THE WINNER', points: 20 },
  quest: { actionId: 'quest', kind: 'quest', label: 'JOIN QUEST', points: 30 },
  watch: { actionId: 'watch', kind: 'quest', label: 'FOLLOW EVENT', points: 10 },
  prediction: { actionId: 'prediction', kind: 'prediction', label: 'MAKE PREDICTION', points: 20 },
  pulse: { actionId: 'pulse', kind: 'poll', label: 'JOIN THE PULSE', points: 15 },
};

const LIVE_ACTION_IDS = ['pulse-live', 'winner', 'quest'];
const UPCOMING_ACTION_IDS = ['watch', 'prediction', 'pulse'];

function actionIdsFor(status: NormalizedSportsStatus): string[] {
  return status === 'IN_PLAY' || status === 'PAUSED' ? LIVE_ACTION_IDS : UPCOMING_ACTION_IDS;
}

export function programmeActions(status: NormalizedSportsStatus): ParticipationAction[] {
  return actionIdsFor(status).map((id) => ACTION_CATALOG[id]);
}

export function lookupAction(actionId: string): ParticipationAction | null {
  return ACTION_CATALOG[actionId] ?? null;
}

// An action is only valid for the status it is presented under, so a client cannot
// post a live-only action against an upcoming event (or vice versa).
export function actionAllowedForStatus(action: ParticipationAction, status: NormalizedSportsStatus): boolean {
  return actionIdsFor(status).includes(action.actionId);
}
