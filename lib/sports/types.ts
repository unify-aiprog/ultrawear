export type Sport = 'football' | 'basketball' | 'tennis' | 'running' | 'other';
export type EventType = 'match_started' | 'score_change' | 'match_ended' | 'milestone' | 'fixture' | 'story';
export type VerificationState = 'verified' | 'unverified' | 'unknown';

export interface SportsEvent {
  id: string;
  sport: Sport;
  competition: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  minute?: number;
  eventType: EventType;
  status: 'scheduled' | 'live' | 'finished';
  occurredAt: string;
  source: { name: string; url?: string };
  verification: VerificationState;
  importance: number;
  tags: string[];
}

export interface ParticipationAction {
  id: string;
  eventId: string;
  kind: 'prediction' | 'poll' | 'reaction' | 'quest';
  label: string;
  points: number;
  expiresAt?: string;
}

export interface LiveExperience {
  event: SportsEvent;
  actions: ParticipationAction[];
  prompt: string;
}
