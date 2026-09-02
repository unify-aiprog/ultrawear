export const MOMENT_TYPES = Object.freeze({
  FOOTBALL: Object.freeze(['goal', 'own_goal', 'penalty_awarded', 'penalty_goal', 'penalty_miss', 'substitution', 'yellow_card', 'second_yellow', 'red_card', 'var', 'injury', 'kickoff', 'halftime', 'full_time', 'extra_time', 'shootout']),
  BASKETBALL: Object.freeze(['three_pointer', 'dunk', 'lead_change', 'buzzer_beater', 'foul', 'timeout', 'quarter_end', 'game_end']),
  TENNIS: Object.freeze(['ace', 'break_point', 'set_point', 'match_point', 'tiebreak', 'double_fault', 'set_end', 'match_end']),
  CRICKET: Object.freeze(['wicket', 'six', 'boundary', 'milestone', 'innings_break']),
  NFL: Object.freeze(['touchdown', 'field_goal', 'turnover', 'two_minute_warning', 'interception', 'quarter_end', 'game_end']),
  FORMULA_1: Object.freeze(['overtake', 'pit_stop', 'safety_car', 'fastest_lap', 'chequered_flag', 'red_flag', 'retirement']),
  RUNNING: Object.freeze(['personal_best', 'lead_change', 'finish', 'split', 'record']),
  UNIVERSAL: Object.freeze(['transfer', 'manager_sacked', 'manager_appointed', 'retirement', 'milestone', 'award', 'record', 'disqualification']),
});

const MOMENT_META = Object.freeze({
  goal: ['GOAL', 'high'], own_goal: ['OWN GOAL', 'high'], penalty_awarded: ['PENALTY', 'high'], penalty_goal: ['PENALTY GOAL', 'high'], penalty_miss: ['PENALTY MISSED', 'high'],
  substitution: ['SUBSTITUTION', 'medium'], yellow_card: ['YELLOW CARD', 'medium'], second_yellow: ['SECOND YELLOW', 'high'], red_card: ['RED CARD', 'high'], var: ['VAR CHECK', 'medium'], injury: ['INJURY', 'medium'],
  kickoff: ['KICK-OFF', 'low'], halftime: ['HALFTIME', 'low'], full_time: ['FULL TIME', 'high'], extra_time: ['EXTRA TIME', 'high'], shootout: ['SHOOTOUT', 'high'],
  three_pointer: ['3-POINTER', 'medium'], dunk: ['DUNK', 'high'], lead_change: ['LEAD CHANGE', 'high'], buzzer_beater: ['BUZZER BEATER', 'high'], foul: ['FOUL', 'medium'], timeout: ['TIMEOUT', 'low'], quarter_end: ['QUARTER END', 'low'], game_end: ['GAME END', 'high'],
  ace: ['ACE', 'medium'], break_point: ['BREAK POINT', 'medium'], set_point: ['SET POINT', 'high'], match_point: ['MATCH POINT', 'high'], tiebreak: ['TIEBREAK', 'high'], double_fault: ['DOUBLE FAULT', 'medium'], set_end: ['SET END', 'low'], match_end: ['MATCH END', 'high'],
  wicket: ['WICKET', 'high'], six: ['SIX', 'high'], boundary: ['BOUNDARY', 'medium'], milestone: ['MILESTONE', 'medium'], innings_break: ['INNINGS BREAK', 'low'],
  touchdown: ['TOUCHDOWN', 'high'], field_goal: ['FIELD GOAL', 'medium'], turnover: ['TURNOVER', 'high'], two_minute_warning: ['2-MIN WARNING', 'medium'], interception: ['INTERCEPTION', 'high'],
  overtake: ['OVERTAKE', 'high'], pit_stop: ['PIT STOP', 'medium'], safety_car: ['SAFETY CAR', 'high'], fastest_lap: ['FASTEST LAP', 'medium'], chequered_flag: ['CHEQUERED FLAG', 'high'], red_flag: ['RED FLAG', 'high'],
  personal_best: ['PERSONAL BEST', 'high'], finish: ['FINISH', 'high'], split: ['SPLIT', 'low'], record: ['RECORD', 'high'],
  transfer: ['TRANSFER', 'high'], manager_sacked: ['MANAGER SACKED', 'high'], manager_appointed: ['MANAGER APPOINTED', 'high'], retirement: ['RETIREMENT', 'high'], award: ['AWARD', 'medium'], disqualification: ['DISQUALIFIED', 'high'],
});

export function normalizeMoment(input = {}) {
  const type = String(input.type ?? '').trim().toLowerCase();
  const meta = MOMENT_META[type];
  if (!meta) return null;
  return Object.freeze({
    id: input.id ?? null,
    type,
    sport: String(input.sport ?? '').trim(),
    severity: input.severity ?? meta[1],
    label: input.label ?? meta[0],
    team: input.team ?? null,
    player: input.player ?? null,
    manager: input.manager ?? null,
    timestamp: input.timestamp ?? null,
    occurredAt: input.occurredAt ?? input.timestamp ?? null,
    minute: input.minute ?? null,
    verified: input.verified === true,
    intensity: input.intensity ?? meta[1],
    animation: input.animation ?? { key: type.replace(/_/g, '-'), replayable: true },
  });
}

export function isHighValueMoment(moment) {
  return Boolean(moment?.verified && (moment.severity === 'high' || moment.intensity === 'high'));
}

export function momentClass(moment) {
  return moment?.type ? `moment-${moment.type.replace(/_/g, '-')}` : '';
}
