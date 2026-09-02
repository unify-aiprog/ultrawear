export const DEMO_MATCHES = Object.freeze([
  Object.freeze({
    id: 'ars-che-2026-09-02', home: 'ARS', away: 'CHE', sport: 'Football', competition: 'Premier League',
    statusLabel: "LIVE · 73'", isLive: true, intensity: 'high', score: { home: 2, away: 1 },
    moment: { type: 'goal', sport: 'Football', verified: false },
    note: 'Preview event — connect verified provider feed to make live.', meta: 'Open match centre'
  }),
  Object.freeze({
    id: 'lal-bos-demo', home: 'LAL', away: 'BOS', sport: 'Basketball', competition: 'NBA',
    statusLabel: 'UP NEXT', isLive: false, intensity: 'low', score: null,
    moment: null,
    note: 'Preview event — awaiting verified schedule feed.', meta: 'Open match centre'
  })
]);
