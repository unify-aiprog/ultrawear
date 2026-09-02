// Team logo endpoints are deliberately kept behind this adapter so the UI does not
// depend on a provider-specific payload shape. For production, these URLs should be
// replaced by UltraWear-hosted, rights-cleared assets (or a licensed sports-data feed).
export const TEAM_LOGOS = Object.freeze({
  ARS: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
  CHE: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
  LAL: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
  BOS: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png',
});

export function getTeamLogo(code) {
  return TEAM_LOGOS[code] ?? null;
}
