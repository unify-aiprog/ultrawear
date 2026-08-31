export type SportsProvider = {
  name: string;
  getCompetitions(input?: { sport?: string }): Promise<unknown[]>;
  getTeams(input: { competitionId?: string; seasonId?: string }): Promise<unknown[]>;
  getPlayers(input: { teamId?: string; competitionId?: string }): Promise<unknown[]>;
  getFixtures(input: { from: string; to: string; competitionId?: string }): Promise<unknown[]>;
  getMatch(input: { externalMatchId: string }): Promise<unknown>;
  getLiveMatches(input?: { competitionId?: string }): Promise<unknown[]>;
  getStandings(input: { competitionId: string; seasonId: string }): Promise<unknown[]>;
};

export type ProviderRequestContext = {
  requestedAt: string;
  requestId: string;
};

export type ProviderHealth = {
  provider: string;
  healthy: boolean;
  checkedAt: string;
  latencyMs?: number;
  message?: string;
};

/**
 * Provider adapters are deliberately isolated from the domain and UI.
 * An adapter is responsible for translating an external API into the
 * canonical UltraWear domain model; it must never leak provider-specific
 * response shapes into application code.
 */
export interface SportsProviderAdapter extends SportsProvider {
  healthCheck(ctx?: ProviderRequestContext): Promise<ProviderHealth>;
}
