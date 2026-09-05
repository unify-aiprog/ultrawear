export type SportSlug = 'football' | 'tennis' | 'basketball' | 'athletics' | 'motorsport' | (string & {});

export type CanonicalSportEventStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'FINISHED'
  | 'POSTPONED'
  | 'SUSPENDED'
  | 'CANCELLED';

export type SportsEventParticipant = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

export type NormalizedSportsEvent = {
  id: string;
  sport: SportSlug;
  startsAt: string;
  status: CanonicalSportEventStatus;
  competition: string;
  stage?: string | null;
  home?: SportsEventParticipant | null;
  away?: SportsEventParticipant | null;
  participants?: SportsEventParticipant[];
  homeScore?: number | null;
  awayScore?: number | null;
  provider: string;
  providerId: string;
  updatedAt?: string | null;
  significance?: {
    competitionWeight?: number;
    stageWeight?: number;
    rivalryWeight?: number;
    championshipWeight?: number;
    athleteWeight?: number;
    audienceWeight?: number;
    communityWeight?: number;
  };
};

export type ProviderHealth = {
  provider: string;
  sport: SportSlug;
  status: 'healthy' | 'degraded' | 'down' | 'not_configured';
  checkedAt: string;
  lastSuccessAt?: string | null;
  latencyMs?: number | null;
  error?: string | null;
};

export type SportsProvider = {
  name: string;
  sport: SportSlug;
  getLiveEvents(): Promise<NormalizedSportsEvent[]>;
  getUpcomingEvents(from: Date, to: Date): Promise<NormalizedSportsEvent[]>;
  getRecentEvents(from: Date, to: Date): Promise<NormalizedSportsEvent[]>;
  getHealth(): Promise<ProviderHealth>;
};
