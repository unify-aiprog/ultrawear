export type ParticipationKind = 'prediction' | 'poll' | 'reaction' | 'quest';
export interface ParticipationRecord { id: string; eventId: string; actionId: string; kind: ParticipationKind; points: number; createdAt: string; }
export interface FanProgress { level: number; xp: number; streak: number; participations: number; badges: string[]; }
export function createFanProgress(): FanProgress { return { level: 1, xp: 0, streak: 0, participations: 0, badges: [] }; }
export function applyParticipation(progress: FanProgress, record: ParticipationRecord): FanProgress {
  const xp = progress.xp + record.points;
  const badges = [...progress.badges];
  if (progress.participations === 0) badges.push('FIRST SIGNAL');
  if (progress.participations + 1 === 10) badges.push('IN THE MIX');
  return { ...progress, xp, level: Math.floor(xp / 100) + 1, participations: progress.participations + 1, streak: Math.max(1, progress.streak) };
}
