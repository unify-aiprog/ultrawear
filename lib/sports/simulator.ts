import type { SportsEvent, LiveExperience, ParticipationAction } from './types';

const now = Date.now();

export const demoEvents: SportsEvent[] = [
  { id: 'uw-demo-1', sport: 'football', competition: 'Community Matchday', home: 'Nigeria', away: 'Ghana', homeScore: 1, awayScore: 0, minute: 68, eventType: 'score_change', status: 'live', occurredAt: new Date(now - 45_000).toISOString(), source: { name: 'UltraWear Demo Simulator' }, verification: 'verified', importance: 96, tags: ['live', 'rivalry', 'africa'] },
  { id: 'uw-demo-2', sport: 'basketball', competition: 'Global Hoops', home: 'Lagos Lions', away: 'Accra Waves', homeScore: 74, awayScore: 71, minute: 31, eventType: 'milestone', status: 'live', occurredAt: new Date(now - 140_000).toISOString(), source: { name: 'UltraWear Demo Simulator' }, verification: 'verified', importance: 84, tags: ['live', 'close-game'] },
  { id: 'uw-demo-3', sport: 'tennis', competition: 'Community Open', home: 'A. Okafor', away: 'M. Mensah', homeScore: 1, awayScore: 1, eventType: 'milestone', status: 'live', occurredAt: new Date(now - 260_000).toISOString(), source: { name: 'UltraWear Demo Simulator' }, verification: 'verified', importance: 77, tags: ['live', 'tennis'] },
];

export function buildExperience(event: SportsEvent): LiveExperience {
  const actions: ParticipationAction[] = [
    { id: `${event.id}:prediction`, eventId: event.id, kind: 'prediction', label: event.homeScore !== null && event.awayScore !== null && event.homeScore > event.awayScore ? `Back ${event.home}` : `Back ${event.away}`, points: 15 },
    { id: `${event.id}:poll`, eventId: event.id, kind: 'poll', label: 'Who changes the game next?', points: 10 },
    { id: `${event.id}:reaction`, eventId: event.id, kind: 'reaction', label: 'Drop a match reaction', points: 5 },
  ];
  return { event, actions, prompt: event.status === 'live' ? 'You are here while it is happening.' : 'Catch the story and join the conversation.' };
}

export function liveExperiences(): LiveExperience[] {
  return [...demoEvents].sort((a, b) => b.importance - a.importance).map(buildExperience);
}
