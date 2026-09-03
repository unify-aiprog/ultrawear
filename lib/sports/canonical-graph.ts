import { getSupabaseAdminClient } from '@/lib/supabase';

export type CanonicalEventPayload = {
  sport: string;
  providerId: string;
  status: string;
  startTime: string;
  competitionId: string;
  competitionName?: string;
  competitionCode?: string | null;
  seasonId: string;
  seasonName?: string;
  seasonStartDate?: string;
  seasonEndDate?: string;
  homeTeamId: string;
  homeTeamName?: string;
  homeTeamCrest?: string | null;
  awayTeamId: string;
  awayTeamName?: string;
  awayTeamCrest?: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
const providerKey = (provider: string, id: string) => `${provider}:${id}`;

type EntityType = 'competition' | 'season' | 'team' | 'event';

async function resolveCanonicalId(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  entityType: EntityType,
  provider: string,
  providerEntityId: string,
  fallback: string,
) {
  if (!supabase) throw new Error('Supabase service role is not configured');
  const { data, error } = await supabase
    .from('sports_entity_links')
    .select('canonical_entity_id')
    .eq('entity_type', entityType)
    .eq('provider', provider)
    .eq('provider_entity_id', providerEntityId)
    .maybeSingle();
  if (error) throw new Error(`Unable to resolve ${entityType} provider link: ${error.message}`);
  return data?.canonical_entity_id ?? fallback;
}

async function linkSportsEntity(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  entityType: EntityType,
  canonicalEntityId: string,
  provider: string,
  providerEntityId: string,
) {
  if (!supabase) throw new Error('Supabase service role is not configured');
  const { error } = await supabase.from('sports_entity_links').upsert({
    entity_type: entityType,
    canonical_entity_id: canonicalEntityId,
    provider,
    provider_entity_id: providerEntityId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'entity_type,provider,provider_entity_id' });
  if (error) throw new Error(`Unable to persist ${entityType} provider link: ${error.message}`);
}

export async function upsertCanonicalEvent(provider: string, payload: CanonicalEventPayload) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error('Supabase service role is not configured');
  const sportId = payload.sport;
  const competitionProviderId = String(payload.competitionId);
  const seasonProviderId = String(payload.seasonId);
  const homeProviderId = String(payload.homeTeamId);
  const awayProviderId = String(payload.awayTeamId);
  const eventProviderId = String(payload.providerId);

  const { error: sportError } = await supabase.from('sports').upsert({ id: sportId, name: sportId[0].toUpperCase() + sportId.slice(1), slug: sportId }, { onConflict: 'id' });
  if (sportError) throw new Error(`Unable to persist sport: ${sportError.message}`);

  const competitionFallback = `competition_${providerKey(provider, competitionProviderId)}`;
  const seasonFallback = `season_${providerKey(provider, seasonProviderId)}`;
  const homeTeamFallback = `team_${providerKey(provider, homeProviderId)}`;
  const awayTeamFallback = `team_${providerKey(provider, awayProviderId)}`;
  const eventFallback = `event_${providerKey(provider, eventProviderId)}`;
  const competitionId = await resolveCanonicalId(supabase, 'competition', provider, competitionProviderId, competitionFallback);
  const seasonId = await resolveCanonicalId(supabase, 'season', provider, seasonProviderId, seasonFallback);
  const homeTeamId = await resolveCanonicalId(supabase, 'team', provider, homeProviderId, homeTeamFallback);
  const awayTeamId = await resolveCanonicalId(supabase, 'team', provider, awayProviderId, awayTeamFallback);
  const eventId = await resolveCanonicalId(supabase, 'event', provider, eventProviderId, eventFallback);

  const { error: competitionError } = await supabase.from('competitions_v2').upsert({
    id: competitionId, sport_id: sportId, name: payload.competitionName ?? `Competition ${competitionProviderId}`,
    slug: slugify(`${provider}-${payload.competitionCode ?? competitionProviderId}-${payload.competitionName ?? ''}`),
    provider, provider_id: competitionProviderId,
  }, { onConflict: 'id' });
  if (competitionError) throw new Error(`Unable to persist competition: ${competitionError.message}`);
  await linkSportsEntity(supabase, 'competition', competitionId, provider, competitionProviderId);

  const { error: seasonError } = await supabase.from('seasons').upsert({
    id: seasonId, sport_id: sportId, competition_id: competitionId,
    name: payload.seasonName ?? `Season ${seasonProviderId}`, slug: slugify(`${provider}-${seasonProviderId}`),
    start_date: payload.seasonStartDate ?? null, end_date: payload.seasonEndDate ?? null,
    provider, provider_id: seasonProviderId,
  }, { onConflict: 'id' });
  if (seasonError) throw new Error(`Unable to persist season: ${seasonError.message}`);
  await linkSportsEntity(supabase, 'season', seasonId, provider, seasonProviderId);

  for (const [teamId, teamProviderId, name, crest] of [
    [homeTeamId, homeProviderId, payload.homeTeamName, payload.homeTeamCrest],
    [awayTeamId, awayProviderId, payload.awayTeamName, payload.awayTeamCrest],
  ] as const) {
    const { error: teamError } = await supabase.from('teams_v2').upsert({
      id: teamId, sport_id: sportId, name: name ?? `Team ${teamProviderId}`,
      slug: slugify(`${provider}-${teamProviderId}-${name ?? ''}`), crest_url: crest ?? null,
      provider, provider_id: teamProviderId,
    }, { onConflict: 'id' });
    if (teamError) throw new Error(`Unable to persist team: ${teamError.message}`);
    await linkSportsEntity(supabase, 'team', teamId, provider, teamProviderId);
    const { error: membershipError } = await supabase.from('team_competitions').upsert({
      team_id: teamId, competition_id: competitionId, season_id: seasonId, role: 'participant',
    }, { onConflict: 'team_id,competition_id,season_id' });
    if (membershipError) throw new Error(`Unable to persist team competition: ${membershipError.message}`);
  }

  const statusMap: Record<string, string> = { TIMED: 'scheduled', SCHEDULED: 'scheduled', IN_PLAY: 'live', PAUSED: 'live', FINISHED: 'completed', POSTPONED: 'postponed', CANCELLED: 'cancelled' };
  const { error: eventError } = await supabase.from('events_v2').upsert({
    id: eventId, sport_id: sportId, competition_id: competitionId, season_id: seasonId,
    home_team_id: homeTeamId, away_team_id: awayTeamId, starts_at: payload.startTime,
    status: statusMap[payload.status] ?? 'unknown', home_score: payload.homeScore, away_score: payload.awayScore,
    provider, provider_id: eventProviderId,
  }, { onConflict: 'id' });
  if (eventError) throw new Error(`Unable to persist event: ${eventError.message}`);
  await linkSportsEntity(supabase, 'event', eventId, provider, eventProviderId);
  return { sportId, competitionId, seasonId, homeTeamId, awayTeamId, eventId };
}
