import type { NormalizedSportsEvent, SportSlug } from '@/lib/sports/types';

export type ProgrammePriority = 'BLOCKBUSTER' | 'FEATURED' | 'LIVE' | 'ON_THE_RADAR' | 'BACKGROUND';
export type ProgrammeWindow = 'NOW' | 'NEXT' | 'TONIGHT' | 'TOMORROW' | 'THIS_WEEKEND' | 'RECENT';

export type ProgrammeEvent = NormalizedSportsEvent & {
  importance: number;
  priority: ProgrammePriority;
  minutesUntilStart?: number;
  window: ProgrammeWindow;
};

export type SportsProgramme = {
  generatedAt: string;
  sport: SportSlug | 'all';
  lead: ProgrammeEvent | null;
  now: ProgrammeEvent[];
  next: ProgrammeEvent[];
  tonight: ProgrammeEvent[];
  tomorrow: ProgrammeEvent[];
  thisWeekend: ProgrammeEvent[];
  recent: ProgrammeEvent[];
  sourceHealth: { healthy: number; degraded: number; down: number; notConfigured: number };
  editorial: { kicker: string; headline: string; body: string };
};

const MAJOR_COMPETITION_TERMS = ['world cup', 'world championship', 'championship', 'olympics', 'olympic', 'grand slam', 'champions league', 'super bowl', 'final', 'playoff', 'play-offs', 'semi-final', 'semifinal'];
const HIGH_AUDIENCE_TERMS = ['premier league', 'la liga', 'serie a', 'bundesliga', 'nba', 'nfl', 'mlb', 'nhl', 'formula 1', 'formula one', 'wimbledon', 'us open', 'australian open', 'roland garros'];
const HIGH_STAKES_TERMS = ['final', 'semi-final', 'semifinal', 'quarter-final', 'quarterfinal', 'relegation', 'promotion', 'qualification', 'qualifier', 'title decider', 'championship decider'];
const RIVALRY_TERMS = ['derby', 'rivalry', 'clasico', 'clásico', 'el clasico', 'el clásico'];
const HIGH_PROFILE_TEAMS = ['real madrid', 'barcelona', 'liverpool', 'arsenal', 'manchester united', 'manchester city', 'bayern', 'juventus', 'chelsea'];

export function scoreEvent(event: NormalizedSportsEvent, now = Date.now()) {
  let score = 15;
  const text = `${event.competition} ${event.stage ?? ''} ${event.home?.name ?? ''} ${event.away?.name ?? ''}`.toLowerCase();
  const significance = event.significance ?? {};

  if (MAJOR_COMPETITION_TERMS.some((term) => text.includes(term))) score += 24;
  if (HIGH_AUDIENCE_TERMS.some((term) => text.includes(term))) score += 10;
  if (HIGH_STAKES_TERMS.some((term) => text.includes(term))) score += 16;
  if (RIVALRY_TERMS.some((term) => text.includes(term))) score += 10;
  const profileCount = HIGH_PROFILE_TEAMS.filter((team) => text.includes(team)).length;
  score += profileCount >= 2 ? 12 : profileCount === 1 ? 5 : 0;

  score += boundedWeight(significance.competitionWeight, 12);
  score += boundedWeight(significance.stageWeight, 10);
  score += boundedWeight(significance.rivalryWeight, 10);
  score += boundedWeight(significance.championshipWeight, 12);
  score += boundedWeight(significance.athleteWeight, 8);
  score += boundedWeight(significance.audienceWeight, 8);
  score += boundedWeight(significance.communityWeight, 5);

  if (event.status === 'IN_PLAY' || event.status === 'PAUSED') score += 35;
  const start = Date.parse(event.startsAt);
  if (Number.isFinite(start)) {
    const hours = (start - now) / 3_600_000;
    if (hours >= 0 && hours <= 6) score += 20;
    else if (hours <= 24) score += 12;
    else if (hours <= 72) score += 5;
  }
  return Math.min(100, score);
}

function boundedWeight(value: number | undefined, cap: number) {
  return Math.min(cap, Math.max(0, value ?? 0));
}

export function programmePriority(event: NormalizedSportsEvent, now = Date.now()): ProgrammePriority {
  if (event.status === 'IN_PLAY' || event.status === 'PAUSED') return 'LIVE';
  const score = scoreEvent(event, now);
  if (score >= 75) return 'BLOCKBUSTER';
  if (score >= 55) return 'FEATURED';
  if (score >= 35) return 'ON_THE_RADAR';
  return 'BACKGROUND';
}

function windowFor(event: NormalizedSportsEvent, now: number): ProgrammeWindow | null {
  const start = Date.parse(event.startsAt);
  if (!Number.isFinite(start)) return event.status === 'FINISHED' ? 'RECENT' : null;
  const delta = start - now;
  const hours = delta / 3_600_000;
  if (event.status === 'IN_PLAY' || event.status === 'PAUSED') return 'NOW';
  if (event.status === 'FINISHED' && delta > -12 * 3_600_000) return 'RECENT';
  if (delta < 0 || ['POSTPONED', 'SUSPENDED', 'CANCELLED'].includes(event.status)) return null;
  const date = new Date(start);
  const today = new Date(now);
  const tomorrow = new Date(now + 24 * 3_600_000);
  if (date.toDateString() === today.toDateString()) return hours <= 6 ? 'NEXT' : 'TONIGHT';
  if (date.toDateString() === tomorrow.toDateString()) return 'TOMORROW';
  if ([0, 6].includes(date.getDay()) || (date.getDay() === 5 && date.getHours() >= 17)) return 'THIS_WEEKEND';
  return 'NEXT';
}

export function buildSportsProgramme(events: NormalizedSportsEvent[], sport: SportSlug | 'all' = 'all', now = Date.now(), sourceHealth: SportsProgramme['sourceHealth'] = { healthy: 0, degraded: 0, down: 0, notConfigured: 0 }): SportsProgramme {
  const enriched: ProgrammeEvent[] = [];
  for (const event of events) {
    const start = Date.parse(event.startsAt);
    const window = windowFor(event, now);
    if (!window) continue;
    enriched.push({ ...event, importance: scoreEvent(event, now), priority: programmePriority(event, now), ...(Number.isFinite(start) ? { minutesUntilStart: Math.round((start - now) / 60_000) } : {}), window });
  }
  const sort = (a: ProgrammeEvent, b: ProgrammeEvent) => b.importance - a.importance || Date.parse(a.startsAt) - Date.parse(b.startsAt) || a.id.localeCompare(b.id);
  const by = (window: ProgrammeWindow) => enriched.filter((event) => event.window === window).sort(sort);
  const nowEvents = by('NOW');
  const next = by('NEXT').slice(0, 8);
  const tonight = by('TONIGHT').slice(0, 8);
  const tomorrow = by('TOMORROW').slice(0, 8);
  const thisWeekend = by('THIS_WEEKEND').slice(0, 8);
  const recent = by('RECENT').sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt) || a.id.localeCompare(b.id)).slice(0, 8);
  const lead = nowEvents[0] ?? next[0] ?? tonight[0] ?? tomorrow[0] ?? thisWeekend[0] ?? recent[0] ?? null;
  const liveCopy = nowEvents.length === 1 && nowEvents[0].home && nowEvents[0].away ? `${nowEvents[0].home.name} v ${nowEvents[0].away.name}` : `${nowEvents.length} events are live now`;
  return {
    generatedAt: new Date(now).toISOString(), sport, lead, now: nowEvents, next, tonight, tomorrow, thisWeekend, recent, sourceHealth,
    editorial: nowEvents.length ? { kicker: 'LIVE NOW', headline: liveCopy, body: 'Verified sport data is driving the programme in real time.' } : lead ? { kicker: lead.priority === 'BLOCKBUSTER' ? 'THE BIG ONE' : 'WHAT’S NEXT', headline: lead.home && lead.away ? `${lead.home.name} v ${lead.away.name}` : lead.competition, body: countdown(lead.minutesUntilStart) } : { kicker: 'THE PROGRAMME', headline: 'Stay close to sport.', body: 'No verified event is available in the current programme window.' },
  };
}

function countdown(minutes?: number) {
  if (minutes === undefined) return 'Upcoming event. Follow the programme for the next update.';
  if (minutes <= 0) return 'Starting now.';
  if (minutes < 60) return `Starts in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `Starts in ${hours}h ${remaining}m.` : `Starts in ${hours}h.`;
}
