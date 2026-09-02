import { EVENT_DEMO_DATA } from './event-demo.js';
import { getTeamVisual } from './identity.js';
import { getTeamLogo } from './logo-assets.js';

const app = document.querySelector('#event-app');
const id = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');
const event = EVENT_DEMO_DATA[id];

const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const badge = (team) => {
  const visual = getTeamVisual(team.code);
  const logo = getTeamLogo(team.code);
  return logo ? `<img class="team-logo" src="${esc(logo)}" alt="" width="52" height="52" />` : `<span class="team-code">${esc(team.code)}</span>`;
};
const statusLabel = event?.status === 'live' ? `LIVE · ${event.minute}'` : event?.status === 'finished' ? 'FULL TIME' : 'UP NEXT';

if (!event) {
  app.innerHTML = `<div class="event-empty"><h1>Event not found</h1><p>This event has not been published to the canonical event registry.</p><a href="/">← Back to UltraWear FC</a></div>`;
} else {
  const score = event.score ? `<div class="event-score"><span>${event.score.home} — ${event.score.away}</span><small>${esc(statusLabel)}</small></div>` : `<div class="event-score"><span>VS</span><small>${esc(statusLabel)}</small></div>`;
  app.innerHTML = `
    <div class="event-shell">
      <a class="event-back" href="/#live">← Back to live sport</a>
      <section class="event-hero">
        <div class="event-kicker"><span>${esc(event.sport)} · ${esc(event.competition)}</span><strong class="event-status ${event.status === 'live' ? 'live' : ''}">${esc(statusLabel)}</strong></div>
        <div class="event-scoreboard">
          <div class="event-team">${badge(event.home)}<span>${esc(event.home.name)}</span></div>
          ${score}
          <div class="event-team away"><span>${esc(event.away.name)}</span>${badge(event.away)}</div>
        </div>
        <div class="event-meta"><span>📍 ${esc(event.venue || 'Venue TBC')}</span><span>Data status: ${esc(event.source)}</span><span>Last updated: ${esc(event.updatedAt || 'Not yet')}</span></div>
        <div class="event-live-note">${event.status === 'live' ? 'This page is designed to update from the verified event registry as new moments and statistics arrive.' : 'This event page persists after the event and becomes the historical match centre automatically.'}</div>
      </section>
      <nav class="event-nav" aria-label="Event sections"><a href="#timeline">Timeline</a><a href="#stats">Stats</a><a href="#community">Community</a><a href="#related">Related</a></nav>
      <div class="event-grid">
        <section class="event-panel" id="timeline"><h2>Live moments</h2>${event.moments.length ? event.moments.map(m => `<div class="event-moment"><time>${esc(m.time)}</time><div><strong>${esc(m.title)}</strong><span>${esc(m.detail)}</span></div></div>`).join('') : '<p>No moments published yet.</p>'}</section>
        <section class="event-panel" id="stats"><h2>Match stats</h2>${event.stats.length ? `<table class="event-stats"><tbody>${event.stats.map(s => `<tr><td>${esc(s[0])}</td><td>${esc(s[1])}</td><td>${esc(s[2])}</td></tr>`).join('')}</tbody></table>` : '<p>Stats will appear when the provider supplies them.</p>'}</section>
        <section class="event-panel" id="community"><h2>For community</h2><p>Reactions, questions, polls, predictions and follows belong to the event itself — not to a temporary live page.</p></section>
        <section class="event-panel" id="related"><h2>Related</h2><p>Team stories, competition context, player profiles and post-match content will attach here through Content Core.</p></section>
      </div>
    </div>`;
}
