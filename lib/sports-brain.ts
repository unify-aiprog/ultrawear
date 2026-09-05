import type { LiveEvent } from '@/lib/ingest/football-live';

export type BrainPriority = 'BLOCKBUSTER' | 'FEATURED' | 'LIVE' | 'ON_THE_RADAR' | 'BACKGROUND';
export type ProgrammeMode = 'LIVE' | 'PROGRAMME';

export type BrainEvent = LiveEvent & {
  sport: string;
  importance: number;
  priority: BrainPriority;
  minutesUntilStart?: number;
};

export type SportsProgramme = {
  mode: ProgrammeMode;
  generatedAt: string;
  lead: BrainEvent | null;
  live: BrainEvent[];
  next: BrainEvent[];
  recent: BrainEvent[];
  editorial: {
    kicker: string;
    headline: string;
    body: string;
  };
};

const BLOCKBUSTER_TEAMS = ['liverpool', 'real madrid', 'barcelona', 'manchester united', 'manchester city', 'arsenal', 'chelsea', 'bayern munich', 'paris saint-germain', 'psg', 'juventus', 'inter'];
const BLOCKBUSTER_COMPETITIONS = ['champions league', 'world cup', 'europa league', 'premier league', 'la liga', 'serie a', 'bundesliga', 'fa cup'];

export function scoreImportance(event: LiveEvent, now = Date.now()): number {
  const names = `${event.home_team.name} ${event.away_team.name}`.toLowerCase();
  const competition = event.competition.toLowerCase();
  let score = 20;
  if (BLOCKBUSTER_TEAMS.some((team) => names.includes(team))) score += 28;
  if (BLOCKBUSTER_COMPETITIONS.some((name) => competition.includes(name))) score += 25;
  if (event.status === 'IN_PLAY' || event.status === 'PAUSED') score += 35;
  const start = Date.parse(event.starts_at);
  if (Number.isFinite(start)) {
    const hours = (start - now) / 3_600_000;
    if (hours >= 0 && hours <= 6) score += 20;
    else if (hours > 6 && hours <= 24) score += 12;
    else if (hours > 24 && hours <= 72) score += 5;
  }
  return Math.min(score, 100);
}

export function priorityFor(event: LiveEvent, now = Date.now()): BrainPriority {
  const importance = scoreImportance(event, now);
  if (event.status === 'IN_PLAY' || event.status === 'PAUSED') return 'LIVE';
  if (importance >= 75) return 'BLOCKBUSTER';
  if (importance >= 55) return 'FEATURED';
  if (importance >= 35) return 'ON_THE_RADAR';
  return 'BACKGROUND';
}

export function enrichEvent(event: LiveEvent, now = Date.now()): BrainEvent {
  const start = Date.parse(event.starts_at);
  return {
    ...event,
    sport: 'football',
    importance: scoreImportance(event, now),
    priority: priorityFor(event, now),
    minutesUntilStart: Number.isFinite(start) ? Math.round((start - now) / 60_000) : undefined,
  };
}

export function buildProgramme(events: LiveEvent[], now = Date.now()): SportsProgramme {
  const enriched = events.map((event) => enrichEvent(event, now));
  const live = enriched.filter((event) => event.status === 'IN_PLAY' || event.status === 'PAUSED')
    .sort((a, b) => b.importance - a.importance);
  const future = enriched.filter((event) => {
    const start = Date.parse(event.starts_at);
    return (event.status === 'SCHEDULED' || event.status === 'TIMED') && Number.isFinite(start) && start >= now;
  }).sort((a, b) => b.importance - a.importance || Date.parse(a.starts_at) - Date.parse(b.starts_at));
  const recent = enriched.filter((event) => event.status === 'FINISHED')
    .sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at)).slice(0, 4);
  const lead = live[0] ?? future[0] ?? recent[0] ?? null;
  const mode: ProgrammeMode = live.length ? 'LIVE' : 'PROGRAMME';

  if (live.length) {
    const subject = live.length === 1 ? `${live[0].home_team.name} v ${live[0].away_team.name}` : `${live.length} matches are live now`;
    return {
      mode, generatedAt: new Date(now).toISOString(), lead, live, next: future.slice(0, 5), recent,
      editorial: { kicker: 'LIVE NOW', headline: subject, body: 'The sports programme is updating from the verified live feed.' },
    };
  }

  if (lead) {
    return {
      mode, generatedAt: new Date(now).toISOString(), lead, live, next: future.slice(0, 5), recent,
      editorial: { kicker: lead.priority === 'BLOCKBUSTER' ? 'THE BIG ONE' : 'WHAT’S NEXT', headline: `${lead.home_team.name} v ${lead.away_team.name}`, body: countdownCopy(lead.minutesUntilStart) },
    };
  }

  return {
    mode, generatedAt: new Date(now).toISOString(), lead: null, live: [], next: [], recent,
    editorial: { kicker: 'THE PROGRAMME', headline: 'Stay close to sport.', body: 'No verified live fixture is available right now. The programme will re-rank automatically when the feed changes.' },
  };
}

function countdownCopy(minutes: number | undefined) {
  if (minutes === undefined) return 'Upcoming event. Follow the programme for the next update.';
  if (minutes <= 0) return 'Starting now.';
  if (minutes < 60) return `Starts in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `Starts in ${hours}h ${remaining}m.` : `Starts in ${hours}h.`;
}
