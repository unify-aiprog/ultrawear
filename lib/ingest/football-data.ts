import { getSupabaseServerClient } from '@/lib/supabase';
import { listCompetitionMatches, listCompetitionTeams, listCompetitions, type FootballDataArea, type FootballDataCompetition, type FootballDataTeam } from '@/lib/providers/football-data';

const PROVIDER = 'football-data.org';
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
const ageGroupFrom = (name: string) => /u\s*21|u21/i.test(name) ? 'U21' : /u\s*19|u19/i.test(name) ? 'U19' : /u\s*18|u18/i.test(name) ? 'U18' : 'SENIOR';
const genderFrom = (name: string) => /women|female/i.test(name) ? 'WOMEN' : 'MEN';
const idFor = (prefix: string, providerId: string | number) => `${prefix}_${PROVIDER.replace(/[^a-z0-9]/gi, '')}_${providerId}`;

export async function ingestFootballCatalogue() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Supabase is not configured');
  const { data: sport, error: sportError } = await supabase.from('sports').upsert({ id: 'football', name: 'Football', slug: 'football', description: 'Global football catalogue, competitions, teams, players and events.' }, { onConflict: 'id' }).select('id').single();
  if (sportError || !sport) throw new Error(`Unable to upsert football sport: ${sportError?.message ?? 'unknown error'}`);

  const { competitions: providerCompetitions } = await listCompetitions();
  const competitions = providerCompetitions.filter((c) => c.plan && c.plan !== 'TIER_FOUR');
  const result = { competitions: 0, seasons: 0, teams: 0, memberships: 0, events: 0, skipped: 0 };

  for (const competition of competitions) {
    const countryId = await upsertCountry(supabase, competition.area);
    const competitionId = idFor('competition', competition.id);
    const { data: competitionRow, error } = await supabase.from('competitions_v2').upsert({ id: competitionId, sport_id: sport.id, country_id: countryId, name: competition.name, slug: slugify(`${competition.name}-${competition.code ?? competition.id}`), competition_type: competition.type, gender: genderFrom(competition.name), age_group: ageGroupFrom(competition.name), level: competition.plan ?? null, provider: PROVIDER, provider_id: String(competition.id), emblem_url: competition.emblem ?? null }, { onConflict: 'id' }).select('id').single();
    if (error || !competitionRow) { result.skipped++; continue; }
    result.competitions++;
    const season = competition.currentSeason;
    if (!season) continue;
    const seasonId = idFor('season', season.id);
    const { data: seasonRow } = await supabase.from('seasons').upsert({ id: seasonId, sport_id: sport.id, competition_id: competitionRow.id, name: `${season.startDate.slice(0, 4)}/${season.endDate.slice(0, 4)}`, slug: `${season.startDate.slice(0, 4)}-${season.endDate.slice(0, 4)}`, start_date: season.startDate, end_date: season.endDate, current: true, provider: PROVIDER, provider_id: String(season.id) }, { onConflict: 'id' }).select('id').single();
    if (!seasonRow) continue;
    result.seasons++;

    const teamResponse = await listCompetitionTeams(competition.code ?? competition.id);
    for (const team of teamResponse.teams) {
      const teamId = await upsertTeam(supabase, sport.id, team);
      if (!teamId) continue;
      result.teams++;
      await supabase.from('team_competitions').upsert({ team_id: teamId, competition_id: competitionRow.id, season_id: seasonRow.id }, { onConflict: 'team_id,competition_id,season_id' });
      for (const person of team.squad ?? []) {
        const personId = idFor('person', person.id);
        const { data: personRow } = await supabase.from('persons_v2').upsert({ id: personId, sport_id: sport.id, name: person.name, slug: slugify(`${person.name}-${person.id}`), person_type: person.role === 'COACH' ? 'coach' : 'player', birth_date: person.dateOfBirth?.slice(0, 10) ?? null, provider: PROVIDER, provider_id: String(person.id) }, { onConflict: 'id' }).select('id').single();
        if (personRow) {
          await supabase.from('team_memberships').upsert({ team_id: teamId, person_id: personRow.id, season_id: seasonRow.id, role: person.role?.toLowerCase() ?? 'player', position: person.position ?? null }, { onConflict: 'team_id,person_id,season_id,role' });
          result.memberships++;
        }
      }
    }

    const matches = await listCompetitionMatches(competition.code ?? competition.id, { status: 'SCHEDULED' });
    for (const match of matches.matches) {
      const homeTeamId = await ensureTeamRef(supabase, sport.id, match.homeTeam.id, match.homeTeam.name, match.homeTeam.crest);
      const awayTeamId = await ensureTeamRef(supabase, sport.id, match.awayTeam.id, match.awayTeam.name, match.awayTeam.crest);
      if (!homeTeamId || !awayTeamId) continue;
      await supabase.from('events_v2').upsert({ id: idFor('event', match.id), sport_id: sport.id, competition_id: competitionRow.id, season_id: seasonRow.id, home_team_id: homeTeamId, away_team_id: awayTeamId, starts_at: match.utcDate, status: match.status, round_name: match.stage ?? match.group ?? (match.matchday ? `Matchday ${match.matchday}` : null), provider: PROVIDER, provider_id: String(match.id) }, { onConflict: 'id' });
      result.events++;
    }
  }
  return result;
}

async function upsertCountry(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, area: FootballDataArea) {
  const id = idFor('country', area.id);
  const { data } = await supabase.from('countries').upsert({ id, name: area.name, slug: slugify(`${area.name}-${area.id}`), code: area.code }, { onConflict: 'id' }).select('id').single();
  return data?.id ?? null;
}

async function upsertTeam(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, sportId: string, team: FootballDataTeam) {
  const countryId = team.area ? await upsertCountry(supabase, team.area) : null;
  const id = idFor('team', team.id);
  const { data } = await supabase.from('teams_v2').upsert({ id, sport_id: sportId, country_id: countryId, name: team.name, short_name: team.shortName ?? null, slug: slugify(`${team.name}-${team.id}`), team_type: 'CLUB', gender: genderFrom(team.name), age_group: ageGroupFrom(team.name), crest_url: team.crest ?? null, provider: PROVIDER, provider_id: String(team.id) }, { onConflict: 'id' }).select('id').single();
  return data?.id ?? null;
}

async function ensureTeamRef(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, sportId: string, providerId: number, name: string, crest?: string | null) {
  const id = idFor('team', providerId);
  const { data } = await supabase.from('teams_v2').upsert({ id, sport_id: sportId, name, slug: slugify(`${name}-${providerId}`), team_type: 'CLUB', gender: 'MEN', age_group: 'SENIOR', crest_url: crest ?? null, provider: PROVIDER, provider_id: String(providerId) }, { onConflict: 'id' }).select('id').single();
  return data?.id ?? null;
}
