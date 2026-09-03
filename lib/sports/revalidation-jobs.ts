import { getSupabaseAdminClient } from '@/lib/supabase';
import { getCompetition, getStandings, listCompetitions, listCompetitionTeams } from '@/lib/providers/football-data';
import { persistObservation, reconcilePersisted, observationHash } from './persistence';

export type CatalogueRevalidationSummary = { competitions: number; seasons: number; teams: number; standings: number; failed: number };
const PROVIDER = 'football-data.org';
const SOURCE_ID = 'football-data.org';

const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
const uniqueSlug = (value: string) => slug(value);
const equals = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

async function verifiedSnapshot(entityType: string, entityId: string, payload: unknown) {
  const hash = observationHash(payload).slice(0, 16);
  await persistObservation(
    { entityType, entityId },
    {
      id: `${SOURCE_ID}:${entityType}:${entityId}:${hash}`,
      sourceId: SOURCE_ID,
      sourceType: 'official',
      observedAt: new Date().toISOString(),
      verification: 'verified',
      confidence: 0.9,
      payload,
    },
  );
  const result = await reconcilePersisted({ entityType, entityId }, equals);
  if (result.status !== 'verified' || result.value === null) {
    throw new Error(`Trust gate blocked ${entityType}:${entityId}: ${result.status}`);
  }
  return result.value;
}

export async function revalidateFootballCatalogue(): Promise<CatalogueRevalidationSummary> {
  const db = getSupabaseAdminClient();
  if (!db) throw new Error('Supabase service role is not configured');
  const summary: CatalogueRevalidationSummary = { competitions: 0, seasons: 0, teams: 0, standings: 0, failed: 0 };
  const { competitions } = await listCompetitions();

  for (const competition of competitions) {
    try {
      const detail = await getCompetition(competition.id);
      const sportId = 'football';
      const competitionId = `competition_${PROVIDER}:${competition.id}`;
      const countryCode = detail.area.code ?? String(detail.area.id);
      const countryId = `country_${countryCode}`;

      await verifiedSnapshot('sport', sportId, { id: sportId, name: 'Football', slug: 'football' });
      await verifiedSnapshot('country', countryId, {
        id: countryId,
        provider: PROVIDER,
        providerId: countryCode,
        name: detail.area.name,
        code: detail.area.code ?? null,
      });
      await verifiedSnapshot('competition', competitionId, {
        provider: PROVIDER,
        providerId: String(detail.id),
        name: detail.name,
        code: detail.code ?? null,
        type: detail.type,
        emblem: detail.emblem ?? null,
        area: { id: detail.area.id, code: detail.area.code ?? null, name: detail.area.name },
      });

      const { data: country, error: countryError } = await db.from('countries').upsert({
        id: countryId, name: detail.area.name, slug: slug(detail.area.name), code: detail.area.code ?? null,
      }, { onConflict: 'id' }).select('id').single();
      if (countryError) throw countryError;
      const { error: competitionError } = await db.from('competitions_v2').upsert({
        id: competitionId, sport_id: sportId, country_id: country?.id ?? null,
        name: detail.name, slug: uniqueSlug(`football-${detail.code ?? detail.id}-${detail.name}`),
        competition_type: detail.type.toLowerCase(), emblem_url: detail.emblem ?? null,
        provider: PROVIDER, provider_id: String(detail.id),
      }, { onConflict: 'id' });
      if (competitionError) throw competitionError;
      summary.competitions++;

      const seasons = detail.seasons ?? (detail.currentSeason ? [detail.currentSeason] : []);
      for (const season of seasons.slice(0, 3)) {
        try {
          const seasonId = `season_${PROVIDER}:${season.id}`;
          const seasonPayload = {
            provider: PROVIDER,
            providerId: String(season.id),
            competitionProviderId: String(detail.id),
            name: `${detail.name} ${season.startDate.slice(0, 4)}/${season.endDate.slice(0, 4)}`,
            startDate: season.startDate,
            endDate: season.endDate,
            current: Boolean(detail.currentSeason?.id === season.id),
          };
          await verifiedSnapshot('season', seasonId, seasonPayload);
          const { error } = await db.from('seasons').upsert({
            id: seasonId, sport_id: sportId, competition_id: competitionId,
            name: seasonPayload.name, slug: uniqueSlug(`football-${detail.id}-${season.id}`),
            start_date: season.startDate, end_date: season.endDate, current: seasonPayload.current,
            provider: PROVIDER, provider_id: String(season.id),
          }, { onConflict: 'id' });
          if (error) throw error;
          summary.seasons++;

          try {
            const teams = await listCompetitionTeams(detail.id, season.id);
            for (const team of teams.teams) {
              try {
                const teamId = `team_${PROVIDER}:${team.id}`;
                await verifiedSnapshot('team', teamId, {
                  provider: PROVIDER,
                  providerId: String(team.id),
                  competitionProviderId: String(detail.id),
                  seasonProviderId: String(season.id),
                  area: { code: team.area?.code ?? null, name: team.area?.name ?? null },
                  name: team.name,
                  shortName: team.shortName ?? team.tla ?? null,
                  crest: team.crest ?? null,
                });
                const { error: teamError } = await db.from('teams_v2').upsert({
                  id: teamId, sport_id: sportId,
                  country_id: team.area?.code ? `country_${team.area.code}` : null,
                  name: team.name, short_name: team.shortName ?? team.tla ?? null,
                  slug: uniqueSlug(`football-team-${team.id}-${team.name}`), crest_url: team.crest ?? null,
                  provider: PROVIDER, provider_id: String(team.id),
                }, { onConflict: 'id' });
                if (teamError) throw teamError;
                const { error: membershipError } = await db.from('team_competitions').upsert({
                  team_id: teamId, competition_id: competitionId, season_id: seasonId, role: 'participant',
                }, { onConflict: 'team_id,competition_id,season_id' });
                if (membershipError) throw membershipError;
                summary.teams++;
              } catch { summary.failed++; }
            }

            const standings = await getStandings(detail.id, season.id);
            for (const table of standings.standings) for (const row of table.table) {
              try {
                const teamId = `team_${PROVIDER}:${row.team.id}`;
                const standingId = `${detail.id}:${season.id}:${row.team.id}`;
                const payload = {
                  competitionProviderId: String(detail.id), seasonProviderId: String(season.id),
                  teamProviderId: String(row.team.id), position: row.position, played: row.playedGames,
                  won: row.won, drawn: row.draw, lost: row.lost, goalsFor: row.goalsFor,
                  goalsAgainst: row.goalsAgainst, goalDifference: row.goalDifference, points: row.points,
                };
                await verifiedSnapshot('standing', standingId, payload);
                const { error } = await db.from('competition_standings').upsert({
                  competition_id: competitionId, season_id: seasonId, position: row.position,
                  team_id: teamId, played: row.playedGames, won: row.won, drawn: row.draw, lost: row.lost,
                  goals_for: row.goalsFor, goals_against: row.goalsAgainst, goal_difference: row.goalDifference,
                  points: row.points, provider: PROVIDER, provider_id: standingId,
                }, { onConflict: 'competition_id,season_id,team_id' });
                if (error) throw error;
                summary.standings++;
              } catch { summary.failed++; }
            }
          } catch { summary.failed++; }
        } catch { summary.failed++; }
      }
    } catch { summary.failed++; }
  }
  return summary;
}
