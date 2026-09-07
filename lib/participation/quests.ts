export type QuestKind = 'live' | 'discovery' | 'community' | 'streak';

export type SportsQuest = {
  id: string;
  title: string;
  description: string;
  kind: QuestKind;
  points: number;
  target: number;
  progress: number;
  expiresAt: string;
};

export const DAILY_QUESTS: Omit<SportsQuest, 'progress'>[] = [
  { id: 'live-signal', title: 'Catch the Signal', description: 'Join one live sports moment.', kind: 'live', points: 40, target: 1, expiresAt: '2099-12-31T23:59:59.999Z' },
  { id: 'discover-new', title: 'Cross the Line', description: 'Follow a sport outside your usual lane.', kind: 'discovery', points: 30, target: 1, expiresAt: '2099-12-31T23:59:59.999Z' },
  { id: 'stand-together', title: 'Join the Stands', description: 'Add one useful thought to the community.', kind: 'community', points: 35, target: 1, expiresAt: '2099-12-31T23:59:59.999Z' },
  { id: 'three-signals', title: 'Stay in the Loop', description: 'Participate in three sports signals.', kind: 'streak', points: 75, target: 3, expiresAt: '2099-12-31T23:59:59.999Z' },
];

export function buildQuests(progress: Partial<Record<QuestKind, number>> = {}): SportsQuest[] {
  return DAILY_QUESTS.map((quest) => ({ ...quest, progress: Math.min(progress[quest.kind] ?? 0, quest.target) }));
}
