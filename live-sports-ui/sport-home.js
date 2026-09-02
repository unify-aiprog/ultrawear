const SPORTS = Object.freeze({
  football: { name: 'Football', mark: 'FB', lede: 'The game, the culture and the community around football.', headline: 'Football, beyond the final whistle.', story: 'Matches, players, managers, moments and the stories shaping football.' },
  basketball: { name: 'Basketball', mark: 'BB', lede: 'The game, the players and the culture moving basketball forward.', headline: 'Basketball, at full speed.', story: 'Games, players, moments and the conversations shaping basketball.' },
  tennis: { name: 'Tennis', mark: 'TN', lede: 'Every court, every rivalry, every moment worth following.', headline: 'Tennis, point by point.', story: 'Matches, players, tournaments and the moments that define the tour.' },
  running: { name: 'Running', mark: 'RN', lede: 'Races, records, athletes and the community that keeps moving.', headline: 'Running, always forward.', story: 'Race results, athletes, milestones and the stories behind the run.' },
});

const pathSport = window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase() || 'football';
const sport = SPORTS[pathSport] || { name: pathSport.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), mark: 'UW', lede: 'Everything happening in this sport, in one place.', headline: 'The sport, beyond the score.', story: 'Live action, stories, intelligence and community.' };

document.title = `UltraWear FC — ${sport.name}`;
const setText = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value; };
setText('#sport-eyebrow', sport.name.toUpperCase());
setText('#sport-title', `${sport.name.toUpperCase()}.`);
setText('#sport-lede', sport.lede);
setText('#sport-mark', sport.mark);
setText('#live-sport-name', sport.name.toUpperCase());
setText('#latest-headline', sport.headline);
setText('#latest-copy', sport.story);
setText('#story-one', sport.headline);

async function loadLive() {
  const grid = document.querySelector('#sport-live-grid');
  const status = document.querySelector('#feed-status');
  const state = document.querySelector('#live-state');
  const description = document.querySelector('#live-description');
  if (!grid) return;
  try {
    const response = await fetch(`/api/sports/live?sport=${encodeURIComponent(pathSport)}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error('feed unavailable');
    const data = await response.json();
    if (data?.verified && Array.isArray(data.events) && data.events.length) {
      const { renderMatchFeed } = await import('./render.js');
      renderMatchFeed(grid, data.events.map((event) => ({
        ...event,
        home: event.home?.shortName || event.home?.name || event.home?.id || 'HOME',
        away: event.away?.shortName || event.away?.name || event.away?.id || 'AWAY',
        statusLabel: event.status === 'halftime' ? 'HALFTIME' : 'LIVE',
        isLive: true,
        intensity: 'high',
        note: 'Verified sports feed',
        meta: 'Open match centre',
      })));
      setText('#feed-status', `${data.events.length} LIVE EVENT${data.events.length === 1 ? '' : 'S'} ↗`);
      setText('#live-state', 'VERIFIED LIVE FEED.');
      setText('#live-description', `${sport.name} events currently live.`);
      return;
    }
  } catch {}
  grid.innerHTML = `<article class="live-card featured loading-card"><div class="card-top"><span class="live-dot">FEED READY</span><span>${sport.name} · Preview</span></div><div class="score"><strong>NO LIVE</strong><b>—</b><strong>YET</strong></div><div class="match-meta"><span>Verified live data will appear here.</span><span>UltraWear</span></div></article>`;
  setText('#feed-status', 'BUILDING THE FEED ↗');
  setText('#live-state', 'WAITING FOR VERIFIED ACTION.');
  setText('#live-description', `The ${sport.name.toLowerCase()} homepage is ready for live data.`);
}

loadLive();
window.setInterval(loadLive, 10000);
