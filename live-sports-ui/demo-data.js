export const DEMO_MATCHES = Object.freeze([
  Object.freeze({
    home: 'ARS', away: 'CHE', sport: 'Football', competition: 'Premier League',
    statusLabel: 'DEMO FEED', isLive: false, intensity: 'medium',
    moment: { type: 'goal', sport: 'Football', verified: false },
    note: 'Verified match data will replace this preview.', meta: 'Editorial preview'
  }),
  Object.freeze({
    home: 'LAL', away: 'BOS', sport: 'Basketball', competition: 'NBA',
    statusLabel: 'DEMO FEED', isLive: false, intensity: 'low',
    moment: { type: 'three_pointer', sport: 'Basketball', verified: false },
    note: 'Verified match data will replace this preview.', meta: 'Editorial preview'
  })
]);
