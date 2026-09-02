export const TEAM_VISUALS = Object.freeze({
  ARS: Object.freeze({ name: 'Arsenal', primary: '#DB0007', secondary: '#FFFFFF', ink: '#111111' }),
  CHE: Object.freeze({ name: 'Chelsea', primary: '#034694', secondary: '#FFFFFF', ink: '#111111' }),
  LAL: Object.freeze({ name: 'Los Angeles Lakers', primary: '#552583', secondary: '#FDB927', ink: '#FFFFFF' }),
  BOS: Object.freeze({ name: 'Boston Celtics', primary: '#007A33', secondary: '#BA9653', ink: '#FFFFFF' }),
});

export function getTeamVisual(code) {
  return TEAM_VISUALS[code] ?? Object.freeze({
    name: code,
    primary: '#11110f',
    secondary: '#f2f0e9',
    ink: '#f2f0e9',
  });
}

export function teamStyle(code) {
  const visual = getTeamVisual(code);
  return `--team-primary:${visual.primary};--team-secondary:${visual.secondary};--team-ink:${visual.ink}`;
}
