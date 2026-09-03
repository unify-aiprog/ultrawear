import { getSupabaseServerClient } from '@/lib/supabase';
import { listCompetitionMatches, listCompetitionTeams, listCompetitions, type FootballDataCompetition, type FootballDataTeam } from '@/lib/providers/football-data';

const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
const ageGroupFrom = (name: string) => /u?2?1\b/i.test(name) ? 'U21' : /u?1?9\b/i.test(name) ? 'U19' : /u?1?8\b/i.test(name) ? 'U18' : 'SENIOR';
const genderFrom = (name: string) => /women|female|w\b/i.test(name) ? 'WOMEN' : 'MEN';

export async function ingestFootballCatalogue() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: sport } = await supabase.from('sports').upsert({ name: 'Football', slug: 'football', description: 'Football competitions, clubs, national teams and events.' }, { onConflict: 'slug' }).select('id').single();
  if (!sport) throw new Error('Unable to upsert football sport');

  const { data: providerCompetitions } = await listCompetitions();
  const competitions = providerCompetitions.filter((competition) => competition.plan && competition.plan !== 'TIER_FOUR');
  const result = { competitions: 0, seasons: 0, teams: 0, memberships: 0, events: 0, skipped: 0 };

  for (const competition of competitions) {
    const countryId = await upsertCountry(supabase, competition.area);
    const { data: competitionRow, error: competitionError } = await supabase.from('competitions_v2').upsert({
      sport_id: sport.id,
      country_id: countryId,
      name: competition.name,
      slug: slugify(`${competition.name}-${competition.code ?? competition.id}`),
      competition_type: competition.type,
      gender: genderFrom(competition.name),
      age_group: ageGroupFrom(competition.name),
      level: competition.plan ?? null,
      provider: 'football-data.org',
      provider_id: String(competition.id),
      emblem_url: competition.emblem ?? null,
    }, { onConflict: 'provider,provider_id' }).select('id').single();
    if (competitionError || !competitionRow) { result.skipped++; continue; }
    result.competitions++;

    const season = competition.currentSeason;
    if (!season) continue;
    const { data: seasonRow } = await supabase.from('seasons').upsert({ competition_id: competitionRow.id, name: `${season.startDate.slice(0,4)}/${season.endDate.slice(0,4)}`, slug: `${season.startDate.slice(0,4)}-${season.endDate.slice(0,4)}`, start_date: season.startDate, end_date: season.endDate, provider: 'football-data.org', provider_id: String(season.id) }, { onConflict: 'provider,provider_id' }).select('id').single();
    if (!seasonRow) continue;
    result.seasons++;

    const teamResponse = await listCompetitionTeams(competition.code ?? competition.id);
    for (const team of teamResponse.teams) {
      const teamId = await upsertTeam(supabase, sport.id, team);
      if (!teamId) continue;
      result.teams++;
      await supabase.from('team_competitions').upsert({ team_id: teamId, competition_id: competitionRow.id, season_id: seasonRow.id, provider: 'football-data.org' }, { onConflict: 'team_id,competition_id,season_id' });
      for (const person of team.squad ?? []) {
        const { data: personRow } = await supabase.from('persons_v2').upsert({ name: person.name, first_name: person.firstName ?? null, last_name: person.lastName ?? null, date_of_birth: person.dateOfBirth ?? null, nationality: person.nationality ?? null, provider: 'football-data.org', provider_id: String(person.id) }, { onConflict: 'provider,provider_id' }).select('id').single();
        if (personRow) {
          await supabase.from('team_memberships').upsert({ team_id: teamId, person_id: personRow.id, season_id: seasonRow.id, role: person.role ?? 'PLAYER', position: person.position ?? null, provider: 'football-data.org' }, { onConflict: 'team_id,person_id,season_id,role' });
          result.memberships++;
        }
      }
    }

    const matches = await listCompetitionMatches(competition.code ?? competition.id, { status: 'SCHEDULED' });
    for (const match of matches.matches) {
      const homeTeamId = await ensureTeamRef(supabase, sport.id, match.homeTeam.id, match.homeTeam.name, match.homeTeam.crest);
      const awayTeamId = await ensureTeamRef(supabase, sport.id, match.awayTeam.id, match.awayTeam.name, match.awayTeam.crest);
      if (!homeTeamId || !awayTeamId) continue;
      await supabase.from('events_v2').upsert({ sport_id: sport.id, competition_id: competitionRow.id, season_id: seasonRow.id, home_team_id: homeTeamId, away_team_id: awayTeamId, starts_at: match.utcDate, status: match.status, venue_name: match.venue ?? null, provider: 'football-data.org', provider_id: String(match.id), metadata: { matchday: match.matchday, stage: match.stage, group: match.group } }, { onConflict: 'provider,provider_id' });
      result.events++;
    }
  }
  return result;
}

async function upsertCountry(supabase: ReturnType<typeof getSupabaseServerClient>, area: FootballDataCompetition['area']) {
  if (!supabase) return null;
  const { data } = await supabase.from('countries').upsert({ name: area.name, slug: slugify(area.name), code: area.code }, { onConflict: 'slug' }).select('id').single();
  return data?.id ?? null;
}

async function upsertTeam(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, sportId: string, team: FootballDataTeam) {
  const countryId = team.area ? await upsertCountry(supabase, team.area) : null;
  const { data } = await supabase.from('teams_v2').upsert({ sport_id: sportId, country_id: countryId, name: team.name, short_name: team.shortName ?? null, slug: slugify(`${team.name}-${team.id}`), team_type: 'CLUB', gender: genderFrom(team.name), age_group: ageGroupFrom(team.name), crest_url: team.crest ?? null, provider: 'football-data.org', provider_id: String(team.id), venue_name: team.venue ?? null }, { onConflict: 'provider,provider_id' }).select('id').single();
  return data?.id ?? null;
}

async function ensureTeamRef(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, sportId: string, providerId: number, name: string, crest?: string | null) {
  const { data } = await supabase.from('teams_v2').upsert({ sport_id: sportId, name, slug: slugify(`${name}-${providerId}`), team_type: 'CLUB', gender: 'MEN', age_group: 'SENIOR', crest_url: crest ?? null, provider: 'football-data.org', provider_id: String(providerId) }, { onConflict: 'provider,provider_id' }).select('id').single();
  return data?.id ?? null;
}
