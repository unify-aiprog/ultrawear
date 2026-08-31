export const SPORTS_EVENTS = {
  MATCH_SCHEDULED: 'MATCH_SCHEDULED',
  MATCH_STARTED: 'MATCH_STARTED',
  MATCH_UPDATED: 'MATCH_UPDATED',
  MATCH_EVENT_CREATED: 'MATCH_EVENT_CREATED',
  SCORE_CHANGED: 'SCORE_CHANGED',
  HALF_TIME: 'HALF_TIME',
  FULL_TIME: 'FULL_TIME',
  STANDINGS_UPDATED: 'STANDINGS_UPDATED',
  PLAYER_UPDATED: 'PLAYER_UPDATED',
  TEAM_UPDATED: 'TEAM_UPDATED',
  NEWS_CANDIDATE_DETECTED: 'NEWS_CANDIDATE_DETECTED',
} as const;

export type SportsEventType = (typeof SPORTS_EVENTS)[keyof typeof SPORTS_EVENTS];

export type SportsDomainEvent<TPayload = Record<string, unknown>> = {
  id: string;
  type: SportsEventType;
  occurredAt: string;
  entityId: string;
  sport: string;
  payload: TPayload;
  source?: {
    provider: string;
    externalId?: string;
    retrievedAt: string;
  };
};
