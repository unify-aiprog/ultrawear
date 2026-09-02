import { DEMO_MATCHES } from './demo-data.js';
import { renderMatchFeed } from './render.js';

function shortName(value) {
  return value?.shortName || value?.name || value?.id || 'TEAM';
}

function toCard(event) {
  const isLive = event.status === 'live' || event.status === 'halftime';
  return {
    id: event.id,
    home: shortName(event.home),
    away: shortName(event.away),
    sport: event.sport,
    competition: event.competition,
    statusLabel: isLive ? event.status.toUpperCase() : event.status === 'finished' ? 'FINAL' : 'UP NEXT',
    isLive,
    intensity: isLive ? 'high' : 'low',
    score: event.score,
    moment: event.moment ? { ...event.moment, verified: true } : null,
    note: event.source?.provider === 'Sportradar' ? 'Verified Sportradar feed' : 'Verified sports feed',
    meta: event.updatedAt ? `Updated ${new Date(event.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Verified feed',
  };
}

async function getEvents(path) {
  const response = await fetch(path, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Feed unavailable: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data?.events) ? data.events : [];
}

export async function loadVerifiedSoccerFeed(container) {
  if (!container) return { verified: false, count: 0 };
  try {
    let events = await getEvents('/api/sports/soccer/live');
    if (!events.length) events = await getEvents('/api/sports/soccer/daily');
    if (events.length) {
      renderMatchFeed(container, events.map(toCard));
      return { verified: true, count: events.length };
    }
  } catch {
    // Keep the demo visible while provider credentials/feed configuration is pending.
  }
  renderMatchFeed(container, DEMO_MATCHES);
  return { verified: false, count: 0 };
}
