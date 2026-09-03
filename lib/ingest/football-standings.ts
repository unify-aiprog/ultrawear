import { getSupabaseServerClient } from '@/lib/supabase';
import { getStandings } from '@/lib/providers/football-data';

const PROVIDER = 'football-data.org';
const idFor = (prefix: string, providerId: string | number) => `${prefix}_${PROVIDER.replace(/[^a-z0-9]/gi, '')}_${providerId}`;

type Db = NonNullable<ReturnType<typeof getSupabaseServerClient>>;

export async function ingestFootballStandings(codes: string[]) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Supabase is not configured');
  let competitions = 0;
  let rows = 0;
  for (const code of codes.filter(Boolean)) {
    const data = await getStandings(code);
    const competitionId = idFor('competition', data.competition.id);
    const seasonId = idFor('season', data.season.id);
    const { data: season } = await supabase.from('seasons').select('id').eq('id', seasonId).maybeSingle();
    if (!season) continue;
    const primary = data.standings.find((standing) => standing.type === 'TOTAL') ?? data.standings[0];
    if (!primary) continue;
    competitions++;
    for (const row of primary.table) {
      const teamId = idFor('team', row.team.id);
      await supabase.from('teams_v2').upsert({ id: teamId, sport_id: 'football', name: row.team.name, slug: slugify(`${row.team.name}-${row.team.id}`), team_type: 'CLUB', gender: 'MEN', age_group: 'SENIOR', crest_url: row.team.crest ?? null, provider: PROVIDER, provider_id: String(row.team.id) }, { onConflict: 'id' });
      await supabase.from('competition_standings').upsert({ competition_id: competitionId, season_id: seasonId, position: row.position, team_id: teamId, played: row.playedGames, won: row.won, drawn: row.draw, lost: row.lost, goals_for: row.goalsFor, goals_against: row.goalsAgainst, goal_difference: row.goalDifference, points: row.points, provider: PROVIDER, provider_id: `${data.competition.id}:${data.season.id}:${row.team.id}`, updated_at: new Date().toISOString() }, { onConflict: 'competition_id,season_id,team_id' });
      rows++;
    }
  }
  return { competitions, rows };
}

function slugify(value: string) { return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100); }
