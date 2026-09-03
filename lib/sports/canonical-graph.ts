import { getSupabaseAdminClient } from '@/lib/supabase';

export type CanonicalEventPayload = {
  sport: string; providerId: string; status: string; startTime: string; competitionId: string; competitionName?: string; competitionCode?: string | null;
  seasonId: string; seasonName?: string; seasonStartDate?: string; seasonEndDate?: string;
  homeTeamId: string; homeTeamName?: string; homeTeamCrest?: string | null; awayTeamId: string; awayTeamName?: string; awayTeamCrest?: string | null;
  homeScore: number | null; awayScore: number | null;
};
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
const providerKey = (provider: string, id: string) => `${provider}:${id}`;

export async function upsertCanonicalEvent(provider: string, payload: CanonicalEventPayload) {
  const supabase = getSupabaseAdminClient(); if (!supabase) throw new Error('Supabase service role is not configured');
  const sportId = payload.sport;
  const competitionProviderId = String(payload.competitionId); const seasonProviderId = String(payload.seasonId);
  const homeProviderId = String(payload.homeTeamId); const awayProviderId = String(payload.awayTeamId);
  const { error: sportError } = await supabase.from('sports').upsert({ id: sportId, name: sportId[0].toUpperCase() + sportId.slice(1), slug: sportId }, { onConflict: 'id' });
  if (sportError) throw new Error(`Unable to persist sport: ${sportError.message}`);
  const competitionId = `competition_${providerKey(provider, competitionProviderId)}`;
  const seasonId = `season_${providerKey(provider, seasonProviderId)}`;
  const homeTeamId = `team_${providerKey(provider, homeProviderId)}`; const awayTeamId = `team_${providerKey(provider, awayProviderId)}`;
  const { error: competitionError } = await supabase.from('competitions_v2').upsert({ id: competitionId, sport_id: sportId, name: payload.competitionName ?? `Competition ${competitionProviderId}`, slug: slugify(`${provider}-${payload.competitionCode ?? competitionProviderId}`), provider, provider_id: competitionProviderId }, { onConflict: 'id' });
  if (competitionError) throw new Error(`Unable to persist competition: ${competitionError.message}`);
  const { error: seasonError } = await supabase.from('seasons').upsert({ id: seasonId, sport_id: sportId, competition_id: competitionId, name: payload.seasonName ?? `Season ${seasonProviderId}`, slug: slugify(`${provider}-${seasonProviderId}`), start_date: payload.seasonStartDate ?? null, end_date: payload.seasonEndDate ?? null, provider, provider_id: seasonProviderId }, { onConflict: 'id' });
  if (seasonError) throw new Error(`Unable to persist season: ${seasonError.message}`);
  for (const [teamId, teamProviderId, name, crest] of [[homeTeamId, homeProviderId, payload.homeTeamName, payload.homeTeamCrest], [awayTeamId, awayProviderId, payload.awayTeamName, payload.awayTeamCrest]] as const) {
    const { error: teamError } = await supabase.from('teams_v2').upsert({ id: teamId, sport_id: sportId, name: name ?? `Team ${teamProviderId}`, slug: slugify(`${provider}-${teamProviderId}`), crest_url: crest ?? null, provider, provider_id: teamProviderId }, { onConflict: 'id' });
    if (teamError) throw new Error(`Unable to persist team: ${teamError.message}`);
    const { error: membershipError } = await supabase.from('team_competitions').upsert({ team_id: teamId, competition_id: competitionId, season_id: seasonId, role: 'participant' }, { onConflict: 'team_id,competition_id,season_id' });
    if (membershipError) throw new Error(`Unable to persist team competition: ${membershipError.message}`);
  }
  const eventId = `event_${providerKey(provider, payload.providerId)}`;
  const statusMap: Record<string, string> = { TIMED: 'scheduled', SCHEDULED: 'scheduled', IN_PLAY: 'live', PAUSED: 'live', FINISHED: 'completed', POSTPONED: 'postponed', CANCELLED: 'cancelled' };
  const { error: eventError } = await supabase.from('events_v2').upsert({ id: eventId, sport_id: sportId, competition_id: competitionId, season_id: seasonId, home_team_id: homeTeamId, away_team_id: awayTeamId, starts_at: payload.startTime, status: statusMap[payload.status] ?? 'unknown', home_score: payload.homeScore, away_score: payload.awayScore, provider, provider_id: payload.providerId }, { onConflict: 'id' });
  if (eventError) throw new Error(`Unable to persist event: ${eventError.message}`);
  return { sportId, competitionId, seasonId, homeTeamId, awayTeamId, eventId };
}
