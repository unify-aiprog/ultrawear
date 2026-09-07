export type SportSlug = 'football' | 'basketball' | 'tennis' | 'athletics' | 'motorsport';
export type Sport = SportSlug | 'running' | 'other';
export type EventType = 'match_started' | 'score_change' | 'match_ended' | 'milestone' | 'fixture' | 'story';
export type VerificationState = 'verified' | 'unverified' | 'unknown';
export type NormalizedSportsStatus = 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED';

export function isSportSlug(value: string): value is SportSlug {
  return ['football', 'basketball', 'tennis', 'athletics', 'motorsport'].includes(value);
}

export interface SportsParticipant {
  id: string;
  name: string;
  imageUrl?: string | null;
  role?: string | null;
}

export interface EventSignificance {
  competitionWeight?: number;
  stageWeight?: number;
  rivalryWeight?: number;
  championshipWeight?: number;
  athleteWeight?: number;
  audienceWeight?: number;
  communityWeight?: number;
}

export interface NormalizedSportsEvent {
  id: string;
  sport: SportSlug;
  startsAt: string;
  status: NormalizedSportsStatus;
  competition: string;
  stage?: string | null;
  home?: SportsParticipant;
  away?: SportsParticipant;
  participants: SportsParticipant[];
  homeScore?: number | null;
  awayScore?: number | null;
  provider: string;
  providerId: string;
  updatedAt?: string;
  significance?: EventSignificance;
}

export type ProviderHealthStatus = 'healthy' | 'degraded' | 'down' | 'not_configured';

export interface ProviderHealth {
  provider: string;
  sport: SportSlug;
  status: ProviderHealthStatus;
  checkedAt: string;
  lastSuccessAt?: string;
  latencyMs?: number;
  error?: string;
}

export interface SportsProvider {
  name: string;
  sport: SportSlug;
  getLiveEvents(): Promise<NormalizedSportsEvent[]>;
  getUpcomingEvents(from: Date, to: Date): Promise<NormalizedSportsEvent[]>;
  getRecentEvents(from: Date, to: Date): Promise<NormalizedSportsEvent[]>;
  getHealth(): Promise<ProviderHealth>;
}

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
