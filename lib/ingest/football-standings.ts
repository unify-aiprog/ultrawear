import { getSupabaseServerClient } from '@/lib/supabase';
import { getStandings } from '@/lib/providers/football-data';
import { canonicalId, canonicalSlug, PROVIDERS } from '@/lib/catalogue/identity';

type Db = NonNullable<ReturnType<typeof getSupabaseServerClient>>;

export async function ingestFootballStandings(codes: string[]) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Supabase is not configured');
  let competitions = 0;
  let rows = 0;
  for (const code of codes.filter(Boolean)) {
    const data = await getStandings(code);
    const competitionId = canonicalId('competition', PROVIDERS.FOOTBALL_DATA, data.competition.id);
    const seasonId = canonicalId('season', PROVIDERS.FOOTBALL_DATA, data.season.id);
    const { data: season, error: seasonError } = await supabase.from('seasons').select('id').eq('id', seasonId).maybeSingle();
    if (seasonError) throw new Error(`Unable to resolve season ${seasonId}: ${seasonError.message}`);
    if (!season) continue;
    const primary = data.standings.find((standing) => standing.type === 'TOTAL') ?? data.standings[0];
    if (!primary) continue;
    competitions++;
    for (const row of primary.table) {
      const teamId = canonicalId('team', PROVIDERS.FOOTBALL_DATA, row.team.id);
      const { error: teamError } = await supabase.from('teams_v2').upsert({ id: teamId, sport_id: 'football', name: row.team.name, slug: canonicalSlug(row.team.name, row.team.id), team_type: 'CLUB', gender: 'MEN', age_group: 'SENIOR', crest_url: row.team.crest ?? null, provider: PROVIDERS.FOOTBALL_DATA, provider_id: String(row.team.id) }, { onConflict: 'id' });
      if (teamError) throw new Error(`Unable to upsert standings team ${row.team.id}: ${teamError.message}`);
      const { error: standingError } = await supabase.from('competition_standings').upsert({ competition_id: competitionId, season_id: seasonId, position: row.position, team_id: teamId, played: row.playedGames, won: row.won, drawn: row.draw, lost: row.lost, goals_for: row.goalsFor, goals_against: row.goalsAgainst, goal_difference: row.goalDifference, points: row.points, provider: PROVIDERS.FOOTBALL_DATA, provider_id: `${data.competition.id}:${data.season.id}:${row.team.id}`, updated_at: new Date().toISOString() }, { onConflict: 'competition_id,season_id,team_id' });
      if (standingError) throw new Error(`Unable to upsert standing ${competitionId}/${seasonId}/${teamId}: ${standingError.message}`);
      rows++;
    }
  }
  return { competitions, rows };
}
