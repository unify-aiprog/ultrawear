import { getSupabaseServerClient } from '@/lib/supabase';
import { listCompetitionTeams, listCompetitions, listMatches, type FootballDataArea, type FootballDataTeam } from '@/lib/providers/football-data';

const PROVIDER = 'football-data.org';
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
const ageGroupFrom = (name: string) => /u\s*21|u21/i.test(name) ? 'U21' : /u\s*19|u19/i.test(name) ? 'U19' : /u\s*18|u18/i.test(name) ? 'U18' : 'SENIOR';
const genderFrom = (name: string) => /women|female/i.test(name) ? 'WOMEN' : 'MEN';
const idFor = (prefix: string, providerId: string | number) => `${prefix}_${PROVIDER.replace(/[^a-z0-9]/gi, '')}_${providerId}`;

type Db = NonNullable<ReturnType<typeof getSupabaseServerClient>>;

export async function ingestFootballCatalogue() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Supabase is not configured');
  const { data: sport, error: sportError } = await supabase.from('sports').upsert({ id: 'football', name: 'Football', slug: 'football', description: 'Global football catalogue, competitions, teams, players and events.' }, { onConflict: 'id' }).select('id').single();
  if (sportError || !sport) throw new Error(`Unable to upsert football sport: ${sportError?.message ?? 'unknown error'}`);

  const { competitions: providerCompetitions } = await listCompetitions();
  const competitions = providerCompetitions.filter((c) => c.plan && c.plan !== 'TIER_FOUR');
  const result = { competitions: 0, seasons: 0, teams: 0, memberships: 0, events: 0, skipped: 0 };
  const competitionIds = new Set<string>();
  const seasonIds = new Set<string>();

  for (const competition of competitions) {
    const countryId = await upsertCountry(supabase, competition.area);
    const competitionId = idFor('competition', competition.id);
    const { data: competitionRow, error } = await supabase.from('competitions_v2').upsert({ id: competitionId, sport_id: sport.id, country_id: countryId, name: competition.name, slug: slugify(`${competition.name}-${competition.code ?? competition.id}`), competition_type: competition.type, gender: genderFrom(competition.name), age_group: ageGroupFrom(competition.name), level: competition.plan ?? null, provider: PROVIDER, provider_id: String(competition.id), emblem_url: competition.emblem ?? null }, { onConflict: 'id' }).select('id').single();
    if (error || !competitionRow) { result.skipped++; continue; }
    competitionIds.add(competitionRow.id); result.competitions++;
    const season = competition.currentSeason;
    if (!season) continue;
    const seasonId = idFor('season', season.id);
    const { data: seasonRow } = await supabase.from('seasons').upsert({ id: seasonId, sport_id: sport.id, competition_id: competitionRow.id, name: `${season.startDate.slice(0, 4)}/${season.endDate.slice(0, 4)}`, slug: `${season.startDate.slice(0, 4)}-${season.endDate.slice(0, 4)}`, start_date: season.startDate, end_date: season.endDate, current: true, provider: PROVIDER, provider_id: String(season.id) }, { onConflict: 'id' }).select('id').single();
    if (!seasonRow) continue;
    seasonIds.add(seasonRow.id); result.seasons++;

    const teamResponse = await listCompetitionTeams(competition.code ?? competition.id, season.id);
    for (const team of teamResponse.teams) {
      const teamId = await upsertTeam(supabase, sport.id, team);
      if (!teamId) continue;
      result.teams++;
      await supabase.from('team_competitions').upsert({ team_id: teamId, competition_id: competitionRow.id, season_id: seasonRow.id }, { onConflict: 'team_id,competition_id,season_id' });
      for (const person of team.squad ?? []) {
        const personId = idFor('person', person.id);
        const nationalityCountryId = person.nationality ? await findCountryIdByName(supabase, person.nationality) : null;
        const { data: personRow } = await supabase.from('persons_v2').upsert({ id: personId, sport_id: sport.id, name: person.name, slug: slugify(`${person.name}-${person.id}`), person_type: person.role === 'COACH' ? 'coach' : 'player', birth_date: person.dateOfBirth?.slice(0, 10) ?? null, nationality_country_id: nationalityCountryId, provider: PROVIDER, provider_id: String(person.id) }, { onConflict: 'id' }).select('id').single();
        if (personRow) {
          await supabase.from('team_memberships').upsert({ team_id: teamId, person_id: personRow.id, season_id: seasonRow.id, role: person.role?.toLowerCase() ?? 'player', position: person.position ?? null }, { onConflict: 'team_id,person_id,season_id,role' });
          result.memberships++;
        }
      }
    }
  }

  const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const { matches } = await listMatches({ dateFrom: from, dateTo: to });
  for (const match of matches) {
    const competitionId = idFor('competition', match.competition.id);
    if (!competitionIds.has(competitionId)) continue;
    const seasonId = idFor('season', match.season.id);
    if (!seasonIds.has(seasonId)) continue;
    const homeTeamId = await ensureTeamRef(supabase, sport.id, match.homeTeam.id, match.homeTeam.name, match.homeTeam.crest);
    const awayTeamId = await ensureTeamRef(supabase, sport.id, match.awayTeam.id, match.awayTeam.name, match.awayTeam.crest);
    if (!homeTeamId || !awayTeamId) continue;
    await supabase.from('events_v2').upsert({ id: idFor('event', match.id), sport_id: sport.id, competition_id: competitionId, season_id: seasonId, home_team_id: homeTeamId, away_team_id: awayTeamId, starts_at: match.utcDate, status: match.status, home_score: match.score?.fullTime?.home ?? null, away_score: match.score?.fullTime?.away ?? null, round_name: match.stage ?? match.group ?? (match.matchday ? `Matchday ${match.matchday}` : null), provider: PROVIDER, provider_id: String(match.id) }, { onConflict: 'id' });
    result.events++;
  }
  return result;
}

async function upsertCountry(supabase: Db, area: FootballDataArea) {
  const id = idFor('country', area.id);
  const { data } = await supabase.from('countries').upsert({ id, name: area.name, slug: slugify(`${area.name}-${area.id}`), code: area.code }, { onConflict: 'id' }).select('id').single();
  return data?.id ?? null;
}
async function findCountryIdByName(supabase: Db, name: string) {
  const { data } = await supabase.from('countries').select('id').ilike('name', name).limit(1).maybeSingle();
  return data?.id ?? null;
}
async function upsertTeam(supabase: Db, sportId: string, team: FootballDataTeam) {
  const countryId = team.area ? await upsertCountry(supabase, team.area) : null;
  const organizationId = idFor('organization', team.id);
  await supabase.from('organizations').upsert({ id: organizationId, sport_id: sportId, country_id: countryId, name: team.name, slug: slugify(`${team.name}-${team.id}`), organization_type: 'club', logo_url: team.crest ?? null, provider: PROVIDER, provider_id: String(team.id) }, { onConflict: 'id' });
  const id = idFor('team', team.id);
  const { data } = await supabase.from('teams_v2').upsert({ id, sport_id: sportId, organization_id: organizationId, country_id: countryId, name: team.name, short_name: team.shortName ?? null, slug: slugify(`${team.name}-${team.id}`), team_type: 'CLUB', gender: genderFrom(team.name), age_group: ageGroupFrom(team.name), crest_url: team.crest ?? null, provider: PROVIDER, provider_id: String(team.id) }, { onConflict: 'id' }).select('id').single();
  return data?.id ?? null;
}
async function ensureTeamRef(supabase: Db, sportId: string, providerId: number, name: string, crest?: string | null) {
  return upsertTeam(supabase, sportId, { id: providerId, name, crest, shortName: name });
}
