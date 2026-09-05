import type { NormalizedSportsEvent, ProviderHealth, SportsProvider } from '@/lib/sports/types';
import { listMatches } from '@/lib/providers/football-data';

const FOOTBALL_PROVIDER = 'football-data.org';

function mapFootballMatch(match: Awaited<ReturnType<typeof listMatches>>['matches'][number]): NormalizedSportsEvent {
  return {
    id: `football-data:event:${match.id}`,
    sport: 'football',
    startsAt: match.utcDate,
    status: match.status as NormalizedSportsEvent['status'],
    competition: match.competition.name,
    stage: match.stage ?? match.group ?? null,
    home: { id: String(match.homeTeam.id), name: match.homeTeam.name, imageUrl: match.homeTeam.crest ?? null },
    away: { id: String(match.awayTeam.id), name: match.awayTeam.name, imageUrl: match.awayTeam.crest ?? null },
    homeScore: match.score?.fullTime?.home ?? null,
    awayScore: match.score?.fullTime?.away ?? null,
    provider: FOOTBALL_PROVIDER,
    providerId: String(match.id),
    updatedAt: new Date().toISOString(),
  };
}

const footballProvider: SportsProvider = {
  name: FOOTBALL_PROVIDER,
  sport: 'football',
  async getLiveEvents() {
    const [inPlay, paused] = await Promise.all([
      listMatches({ status: 'IN_PLAY' }),
      listMatches({ status: 'PAUSED' }),
    ]);
    return [...inPlay.matches, ...paused.matches].map(mapFootballMatch);
  },
  async getUpcomingEvents(from, to) {
    const result = await listMatches({ dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) });
    return result.matches.filter((match) => match.status === 'SCHEDULED' || match.status === 'TIMED').map(mapFootballMatch);
  },
  async getRecentEvents(from, to) {
    const result = await listMatches({ dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) });
    return result.matches.filter((match) => match.status === 'FINISHED').map(mapFootballMatch);
  },
  async getHealth(): Promise<ProviderHealth> {
    const started = Date.now();
    try {
      await listMatches({ status: 'IN_PLAY' });
      return { provider: FOOTBALL_PROVIDER, sport: 'football', status: 'healthy', checkedAt: new Date().toISOString(), lastSuccessAt: new Date().toISOString(), latencyMs: Date.now() - started };
    } catch (error) {
      return { provider: FOOTBALL_PROVIDER, sport: 'football', status: 'down', checkedAt: new Date().toISOString(), latencyMs: Date.now() - started, error: error instanceof Error ? error.message : 'Unknown provider error' };
    }
  },
};

const unsupportedProvider = (sport: NormalizedSportsEvent['sport']): SportsProvider => ({
  name: `${sport}:not-configured`,
  sport,
  async getLiveEvents() { return []; },
  async getUpcomingEvents() { return []; },
  async getRecentEvents() { return []; },
  async getHealth() { return { provider: `${sport}:not-configured`, sport, status: 'not_configured', checkedAt: new Date().toISOString() }; },
});

export const sportsProviders: SportsProvider[] = [footballProvider, unsupportedProvider('tennis'), unsupportedProvider('basketball'), unsupportedProvider('athletics'), unsupportedProvider('motorsport')];

export function getSportsProvider(sport: string) {
  return sportsProviders.find((provider) => provider.sport === sport);
}
