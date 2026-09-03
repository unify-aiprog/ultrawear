import { getSupabaseAdminClient } from '@/lib/supabase';
import { getCompetition, getStandings, listCompetitions, listCompetitionTeams, getTeam } from '@/lib/providers/football-data';

export type CatalogueRevalidationSummary = { competitions: number; seasons: number; teams: number; standings: number; failed: number };

export async function revalidateFootballCatalogue(): Promise<CatalogueRevalidationSummary> {
  const db = getSupabaseAdminClient();
  if (!db) throw new Error('Supabase service role is not configured');
  const summary: CatalogueRevalidationSummary = { competitions: 0, seasons: 0, teams: 0, standings: 0, failed: 0 };
  const { competitions } = await listCompetitions();

  for (const competition of competitions) {
    try {
      const detail = await getCompetition(competition.id);
      const sportId = 'football';
      const competitionId = `competition_football-data.org:${competition.id}`;
      await db.from('sports').upsert({ id: sportId, name: 'Football', slug: 'football' }, { onConflict: 'id' });
      const { data: country } = await db.from('countries').upsert({ id: `country_${detail.area.code ?? detail.area.id}`, name: detail.area.name, slug: slug(detail.area.name), code: detail.area.code }, { onConflict: 'id' }).select('id').single();
      const { error: competitionError } = await db.from('competitions_v2').upsert({ id: competitionId, sport_id: sportId, country_id: country?.id ?? null, name: detail.name, slug: uniqueSlug(`football-${detail.code ?? detail.id}-${detail.name}`), competition_type: detail.type.toLowerCase(), emblem_url: detail.emblem ?? null, provider: 'football-data.org', provider_id: String(detail.id) }, { onConflict: 'id' });
      if (competitionError) throw competitionError;
      summary.competitions++;
      const seasons = detail.seasons ?? (detail.currentSeason ? [detail.currentSeason] : []);
      for (const season of seasons.slice(0, 3)) {
        const seasonId = `season_football-data.org:${season.id}`;
        const { error } = await db.from('seasons').upsert({ id: seasonId, sport_id: sportId, competition_id: competitionId, name: `${detail.name} ${season.startDate.slice(0, 4)}/${season.endDate.slice(0, 4)}`, slug: uniqueSlug(`football-${detail.id}-${season.id}`), start_date: season.startDate, end_date: season.endDate, current: Boolean(detail.currentSeason?.id === season.id), provider: 'football-data.org', provider_id: String(season.id) }, { onConflict: 'id' });
        if (error) throw error;
        summary.seasons++;
        try {
          const teams = await listCompetitionTeams(detail.id, season.id);
          for (const team of teams.teams) {
            const teamId = `team_football-data.org:${team.id}`;
            const { error: teamError } = await db.from('teams_v2').upsert({ id: teamId, sport_id: sportId, country_id: team.area?.code ? `country_${team.area.code}` : null, name: team.name, short_name: team.shortName ?? team.tla ?? null, slug: uniqueSlug(`football-team-${team.id}-${team.name}`), crest_url: team.crest ?? null, provider: 'football-data.org', provider_id: String(team.id) }, { onConflict: 'id' });
            if (teamError) throw teamError;
            const { error: membershipError } = await db.from('team_competitions').upsert({ team_id: teamId, competition_id: competitionId, season_id: seasonId, role: 'participant' }, { onConflict: 'team_id,competition_id,season_id' });
            if (membershipError) throw membershipError;
            summary.teams++;
          }
          const standings = await getStandings(detail.id, season.id);
          for (const table of standings.standings) for (const row of table.table) {
            const teamId = `team_football-data.org:${row.team.id}`;
            const { error } = await db.from('competition_standings').upsert({ competition_id: competitionId, season_id: seasonId, position: row.position, team_id: teamId, played: row.playedGames, won: row.won, drawn: row.draw, lost: row.lost, goals_for: row.goalsFor, goals_against: row.goalsAgainst, goal_difference: row.goalDifference, points: row.points, provider: 'football-data.org', provider_id: `${detail.id}:${season.id}:${row.team.id}` }, { onConflict: 'competition_id,season_id,team_id' });
            if (error) throw error;
            summary.standings++;
          }
        } catch { summary.failed++; }
      }
    } catch { summary.failed++; }
  }
  return summary;
}

const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
const uniqueSlug = (value: string) => slug(value);
