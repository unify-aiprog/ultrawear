export const EVENT_DEMO_DATA = Object.freeze({
  'ars-che-2026-09-02': Object.freeze({
    id: 'ars-che-2026-09-02', sport: 'Football', competition: 'Premier League',
    status: 'live', startsAt: '2026-09-02T19:00:00Z', updatedAt: '2026-09-02T19:42:00Z',
    home: { code: 'ARS', name: 'Arsenal' }, away: { code: 'CHE', name: 'Chelsea' },
    score: { home: 2, away: 1 }, venue: 'Emirates Stadium', source: 'Preview data',
    minute: 73,
    stats: [
      ['Possession', '54%', '46%'], ['Shots', '12', '8'], ['Shots on target', '6', '3'],
      ['Corners', '5', '2'], ['Fouls', '8', '11']
    ],
    moments: [
      { time: "68'", title: 'GOAL — Arsenal', detail: 'Bukayo Saka', type: 'goal' },
      { time: "61'", title: 'Yellow Card — Chelsea', detail: 'Defensive challenge', type: 'card' },
      { time: "52'", title: 'Substitution — Arsenal', detail: 'Fresh legs introduced', type: 'substitution' },
      { time: "41'", title: 'GOAL — Chelsea', detail: 'Chelsea pull one back', type: 'goal' },
      { time: "27'", title: 'GOAL — Arsenal', detail: 'Arsenal take the lead', type: 'goal' }
    ]
  }),
  'lal-bos-demo': Object.freeze({
    id: 'lal-bos-demo', sport: 'Basketball', competition: 'NBA', status: 'scheduled',
    startsAt: '2026-09-03T00:00:00Z', updatedAt: null,
    home: { code: 'LAL', name: 'Los Angeles Lakers' }, away: { code: 'BOS', name: 'Boston Celtics' },
    score: null, venue: 'Crypto.com Arena', source: 'Preview data', minute: null,
    stats: [], moments: []
  })
});
