const API_BASE = 'https://api.football-data.org/v4';

export type FootballDataArea = { id: number; name: string; code: string | null; flag?: string | null };
export type FootballDataSeason = { id: number; startDate: string; endDate: string; currentMatchday: number | null; winner?: unknown };
export type FootballDataCompetition = { id: number; name: string; code: string | null; type: string; plan?: string | null; emblem?: string | null; area: FootballDataArea; currentSeason?: FootballDataSeason | null; seasons?: FootballDataSeason[] };
export type FootballDataPerson = { id: number; name: string; firstName?: string | null; lastName?: string | null; dateOfBirth?: string | null; nationality?: string | null; position?: string | null; role?: string | null };
export type FootballDataTeam = { id: number; name: string; shortName?: string | null; tla?: string | null; crest?: string | null; area?: FootballDataArea | null; venue?: string | null; founded?: number | null; website?: string | null; squad?: FootballDataPerson[] };
export type FootballDataMatch = {
  id: number; utcDate: string; status: string; matchday?: number | null; stage?: string | null; group?: string | null; venue?: string | null;
  competition: { id: number; name: string; code?: string | null }; season: FootballDataSeason;
  homeTeam: { id: number; name: string; crest?: string | null }; awayTeam: { id: number; name: string; crest?: string | null };
  score?: { winner?: string | null; duration?: string | null; fullTime?: { home?: number | null; away?: number | null }; halfTime?: { home?: number | null; away?: number | null } };
};
export type FootballDataStandingRow = {
  position: number; team: { id: number; name: string; crest?: string | null }; playedGames: number; won: number; draw: number; lost: number;
  points: number; goalsFor: number; goalsAgainst: number; goalDifference: number;
};
export type FootballDataStanding = { stage?: string | null; type?: string | null; group?: string | null; table: FootballDataStandingRow[] };

export class FootballDataError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = 'FootballDataError'; this.status = status; }
}

async function request<T>(path: string): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) throw new FootballDataError('FOOTBALL_DATA_API_TOKEN is not configured', 500);
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json', 'X-Auth-Token': token }, cache: 'no-store' });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new FootballDataError(`football-data.org request failed (${response.status})${body ? `: ${body.slice(0, 240)}` : ''}`, response.status);
  }
  return response.json() as Promise<T>;
}
export async function listCompetitions() { return request<{ count: number; competitions: FootballDataCompetition[] }>('/competitions'); }
export async function getCompetition(codeOrId: string | number) { return request<FootballDataCompetition>(`/competitions/${encodeURIComponent(String(codeOrId))}`); }
export async function listCompetitionTeams(codeOrId: string | number, season?: number) { const query = season ? `?season=${season}` : ''; return request<{ count: number; competition: FootballDataCompetition; season: FootballDataSeason; teams: FootballDataTeam[] }>(`/competitions/${encodeURIComponent(String(codeOrId))}/teams${query}`); }
export async function listCompetitionMatches(codeOrId: string | number, params: Record<string, string | number | undefined> = {}) {
  return request<{ count: number; competition: FootballDataCompetition; season: FootballDataSeason; matches: FootballDataMatch[] }>(`/competitions/${encodeURIComponent(String(codeOrId))}/matches${buildQuery(params)}`);
}
export async function listMatches(params: Record<string, string | number | undefined> = {}) { return request<{ count: number; matches: FootballDataMatch[] }>(`/matches${buildQuery(params)}`); }
export async function getStandings(codeOrId: string | number, season?: number) { const query = season ? `?season=${season}` : ''; return request<{ competition: FootballDataCompetition; season: FootballDataSeason; standings: FootballDataStanding[] }>(`/competitions/${encodeURIComponent(String(codeOrId))}/standings${query}`); }
export async function getTeam(id: number) { return request<FootballDataTeam>(`/teams/${id}`); }

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  return query.size ? `?${query}` : '';
}
