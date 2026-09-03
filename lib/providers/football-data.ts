const API_BASE = 'https://api.football-data.org/v4';
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;

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
  retryable: boolean;
  constructor(message: string, status: number, retryable = false) {
    super(message);
    this.name = 'FootballDataError';
    this.status = status;
    this.retryable = retryable;
  }
}

async function request<T>(path: string): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) throw new FootballDataError('FOOTBALL_DATA_API_TOKEN is not configured', 500);

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        headers: { Accept: 'application/json', 'X-Auth-Token': token },
        cache: 'no-store',
        signal: controller.signal,
      });

      if (response.ok) return response.json() as Promise<T>;

      const body = await response.text().catch(() => '');
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === MAX_RETRIES) {
        throw new FootballDataError(
          `football-data.org request failed (${response.status})${body ? `: ${body.slice(0, 240)}` : ''}`,
          response.status,
          retryable,
        );
      }

      const retryAfter = Number(response.headers.get('retry-after'));
      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 15_000)
        : 500 * 2 ** attempt;
      await sleep(delayMs);
    } catch (error) {
      lastError = error;
      const retryable = error instanceof FootballDataError ? error.retryable : true;
      if (!retryable || attempt === MAX_RETRIES) {
        if (error instanceof FootballDataError) throw error;
        const message = error instanceof Error && error.name === 'AbortError'
          ? `football-data.org request timed out after ${REQUEST_TIMEOUT_MS}ms`
          : `football-data.org request failed: ${error instanceof Error ? error.message : 'unknown error'}`;
        throw new FootballDataError(message, 503, true);
      }
      await sleep(500 * 2 ** attempt);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError instanceof Error ? lastError : new FootballDataError('football-data.org request failed', 503, true);
}

function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

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
