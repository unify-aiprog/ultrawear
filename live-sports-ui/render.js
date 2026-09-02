import { getTeamVisual, teamStyle } from './identity.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;'
  }[char]));
}

function teamBadge(code) {
  const visual = getTeamVisual(code);
  return `<span class="team-badge" style="${teamStyle(code)}" aria-label="${escapeHtml(visual.name)}">${escapeHtml(code)}</span>`;
}

export function renderTeamMatchCard(match) {
  const home = getTeamVisual(match.home);
  const away = getTeamVisual(match.away);
  const status = escapeHtml(match.statusLabel ?? 'UP NEXT');
  const competition = escapeHtml(match.competition ?? 'Sport');
  const note = escapeHtml(match.note ?? 'Verified live data will appear here.');

  return `
    <article class="live-card team-match-card" style="${teamStyle(match.home)}" data-match-card>
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
    </article>`;
}

export function renderMatchFeed(container, matches) {
  if (!container) return;
  container.innerHTML = matches.map(renderTeamMatchCard).join('');
}
