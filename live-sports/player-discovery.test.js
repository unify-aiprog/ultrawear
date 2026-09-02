import { rankPlayersToWatch } from './player-discovery.js';

const results = rankPlayersToWatch([
  {
    personId: 'player-1',
    player: { personId: 'player-1', teamIds: ['home'] },
    history: [
      { eventId: 'e2', minutes: 90, stats: { goals: 1, assists: 1 } },
      { eventId: 'e1', minutes: 80, stats: { goals: 0, assists: 1 } },
    ],
    upcomingEvents: [{ id: 'e3', status: 'scheduled', home: { id: 'home' }, away: { id: 'away' } }],
  },
  {
    personId: 'player-2',
    player: { personId: 'player-2', teamIds: ['other'] },
    history: [{ eventId: 'e0', minutes: 20, stats: {} }],
    upcomingEvents: [{ id: 'e3', status: 'scheduled', home: { id: 'home' }, away: { id: 'away' } }],
  },
]);

if (results[0].personId !== 'player-1') throw new Error('expected player-1 to rank first');
if (results[0].signals.recentPerformance <= 0) throw new Error('expected recent performance signal');
if (results[0].signals.upcomingEvent <= 0) throw new Error('expected upcoming event signal');
if (!results[0].reasons.includes('Upcoming event involving current team')) throw new Error('expected upcoming-event reason');
if (results[1].signals.upcomingEvent !== 0) throw new Error('unrelated team must not receive upcoming-event signal');

console.log('player-discovery tests passed');
