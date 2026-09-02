import { getTeamVisual, teamStyle } from './identity.js';
import { getTeamLogo } from './logo-assets.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;'
  }[char]));
}

function teamBadge(code) {
  const visual = getTeamVisual(code);
  const logo = getTeamLogo(code);
  const logoMarkup = logo
    ? `<img class="team-logo" src="${escapeHtml(logo)}" alt="" loading="lazy" decoding="async" />`
    : `<span class="team-code">${escapeHtml(code)}</span>`;
  return `<span class="team-badge" style="${teamStyle(code)}" aria-label="${escapeHtml(visual.name)}">${logoMarkup}</span>`;
}

export function renderTeamMatchCard(match) {
  const home = getTeamVisual(match.home);
  const away = getTeamVisual(match.away);
  const status = escapeHtml(match.statusLabel ?? 'UP NEXT');
  const competition = escapeHtml(match.competition ?? 'Sport');
  const note = escapeHtml(match.note ?? 'Verified live data will appear here.');
  const intensity = escapeHtml(match.intensity ?? (match.isLive ? 'high' : 'low'));

  return `
    <article class="live-card team-match-card motion-${intensity}" style="${teamStyle(match.home)};--away-primary:${away.primary};--away-secondary:${away.secondary}" data-match-card data-intensity="${intensity}">
      <div class="card-top">
        <span class="live-dot ${match.isLive ? 'is-live' : 'is-up-next'}">${status}</span>
        <span>${escapeHtml(match.sport ?? 'Sport')} · ${competition}</span>
      </div>
      <div class="team-pair" aria-label="${escapeHtml(home.name)} versus ${escapeHtml(away.name)}">
        <div class="team team-home" style="${teamStyle(match.home)}">
          ${teamBadge(match.home)}
          <strong>${escapeHtml(match.home)}</strong>
        </div>
        <div class="versus"><span>VS</span></div>
        <div class="team team-away" style="${teamStyle(match.away)}">
          ${teamBadge(match.away)}
          <strong>${escapeHtml(match.away)}</strong>
        </div>
      </div>
      <div class="match-meta"><span>${note}</span><span>${escapeHtml(match.meta ?? 'Source pending')}</span></div>
      <div class="card-sweep" aria-hidden="true"></div>
      <div class="momentum-line" aria-hidden="true"><span></span></div>
    </article>`;
}

export function renderMatchFeed(container, matches) {
  if (!container) return;
  container.innerHTML = matches.map(renderTeamMatchCard).join('');
}
