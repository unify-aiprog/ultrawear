export const MOMENT_TYPES = Object.freeze({
  FOOTBALL: Object.freeze(['goal', 'red_card', 'penalty', 'var', 'halftime', 'full_time']),
  BASKETBALL: Object.freeze(['three_pointer', 'dunk', 'lead_change', 'buzzer_beater']),
  TENNIS: Object.freeze(['ace', 'break_point', 'set_point', 'match_point', 'tiebreak']),
  CRICKET: Object.freeze(['wicket', 'six', 'boundary', 'milestone', 'innings_break']),
  NFL: Object.freeze(['touchdown', 'field_goal', 'turnover', 'two_minute_warning']),
  FORMULA_1: Object.freeze(['overtake', 'pit_stop', 'safety_car', 'fastest_lap', 'chequered_flag']),
  RUNNING: Object.freeze(['personal_best', 'lead_change', 'finish', 'split']),
});

const MOMENT_META = Object.freeze({
  goal: ['GOAL', 'high'], red_card: ['RED CARD', 'high'], penalty: ['PENALTY', 'medium'], var: ['VAR CHECK', 'medium'], halftime: ['HALFTIME', 'low'], full_time: ['FULL TIME', 'high'],
  three_pointer: ['3-POINTER', 'medium'], dunk: ['DUNK', 'high'], lead_change: ['LEAD CHANGE', 'high'], buzzer_beater: ['BUZZER BEATER', 'high'],
  ace: ['ACE', 'medium'], break_point: ['BREAK POINT', 'medium'], set_point: ['SET POINT', 'high'], match_point: ['MATCH POINT', 'high'], tiebreak: ['TIEBREAK', 'high'],
  wicket: ['WICKET', 'high'], six: ['SIX', 'high'], boundary: ['BOUNDARY', 'medium'], milestone: ['MILESTONE', 'medium'], innings_break: ['INNINGS BREAK', 'low'],
  touchdown: ['TOUCHDOWN', 'high'], field_goal: ['FIELD GOAL', 'medium'], turnover: ['TURNOVER', 'high'], two_minute_warning: ['2-MIN WARNING', 'medium'],
  overtake: ['OVERTAKE', 'high'], pit_stop: ['PIT STOP', 'medium'], safety_car: ['SAFETY CAR', 'high'], fastest_lap: ['FASTEST LAP', 'medium'], chequered_flag: ['CHEQUERED FLAG', 'high'],
  personal_best: ['PERSONAL BEST', 'high'], finish: ['FINISH', 'high'], split: ['SPLIT', 'low'],
});

export function normalizeMoment(input = {}) {
  const type = String(input.type ?? '').trim().toLowerCase();
  const meta = MOMENT_META[type];
  if (!meta) return null;
  return Object.freeze({
    type,
    sport: String(input.sport ?? '').trim(),
    severity: input.severity ?? meta[1],
    label: input.label ?? meta[0],
    team: input.team ?? null,
    timestamp: input.timestamp ?? null,
    verified: input.verified === true,
    intensity: input.intensity ?? meta[1],
  });
}

export function isHighValueMoment(moment) {
  return Boolean(moment?.verified && (moment.severity === 'high' || moment.intensity === 'high'));
}

export function momentClass(moment) {
  return moment?.type ? `moment-${moment.type.replace(/_/g, '-')}` : '';
}
