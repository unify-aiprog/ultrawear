export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'removed' | 'appeal';

export interface CommunitySubmission {
  id: string;
  authorId: string;
  body: string;
  status: ModerationStatus;
  createdAt: string;
  moderatedAt?: string;
  moderatorId?: string;
  reason?: string;
}

const ALLOWED: Record<ModerationStatus, ModerationStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['removed'],
  rejected: ['appeal'],
  removed: ['appeal'],
  appeal: ['approved', 'rejected'],
};

export function canModerate(from: ModerationStatus, to: ModerationStatus) {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function moderateSubmission(item: CommunitySubmission, to: ModerationStatus, moderatorId: string, reason = '') {
  if (!moderatorId || !canModerate(item.status, to)) throw new Error(`Invalid moderation transition: ${item.status} -> ${to}`);
  return { ...item, status: to, moderatorId, reason, moderatedAt: new Date().toISOString() };
}
