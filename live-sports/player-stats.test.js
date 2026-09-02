import { aggregatePlayerStats, recentPlayerForm } from './player-stats.js';

const history = [
  { eventId: 'e2', startsAt: '2026-09-02T19:00:00Z', started: true, minutes: 90, stats: { goals: 1, assists: 1, shots: 3 } },
  { eventId: 'e1', startsAt: '2026-08-30T15:00:00Z', started: false, minutes: 24, stats: { goals: 0, assists: 1, shots: 1 } },
];

const stats = aggregatePlayerStats(history);
if (stats.appearances !== 2) throw new Error('expected two appearances');
if (stats.starts !== 1) throw new Error('expected one start');
if (stats.minutes !== 114) throw new Error('expected 114 minutes');
if (stats.goals !== 1) throw new Error('expected one goal');
if (stats.assists !== 2) throw new Error('expected two assists');
if (stats.shots !== 4) throw new Error('expected four shots');

const form = recentPlayerForm(history, 1);
if (form.length !== 1 || form[0].eventId !== 'e2') throw new Error('expected most recent form entry');

console.log('player-stats tests passed');
