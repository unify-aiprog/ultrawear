import { getTeamVisual, teamStyle } from './identity.js';
import { getTeamLogo } from './logo-assets.js';
import { isHighValueMoment, momentClass, normalizeMoment } from './moments.js';

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

function renderMoment(moment) {
  const normalized = normalizeMoment(moment);
  if (!normalized) return '';
  const verifiedClass = normalized.verified ? ' is-verified' : ' is-demo';
  const announce = isHighValueMoment(normalized) ? ' aria-live="polite"' : '';
  return `<div class="match-moment ${momentClass(normalized)}${verifiedClass}"${announce}>
    <span class="moment-label">${escapeHtml(normalized.label)}</span>
    <span>${escapeHtml(normalized.verified ? 'Verified live event' : 'Preview event — not live')}</span>
  </div>`;
}

export function renderTeamMatchCard(match) {
  const home = getTeamVisual(match.home);
  const away = getTeamVisual(match.away);
  const status = escapeHtml(match.statusLabel ?? 'UP NEXT');
  const competition = escapeHtml(match.competition ?? 'Sport');
  const note = escapeHtml(match.note ?? 'Verified live data will appear here.');
  const intensity = escapeHtml(match.intensity ?? (match.isLive ? 'high' : 'low'));
  const moment = renderMoment(match.moment);
  const normalizedMoment = normalizeMoment(match.moment);
  const momentData = normalizedMoment ? ` data-moment="${escapeHtml(normalizedMoment.type)}"` : '';
  const eventId = encodeURIComponent(match.id ?? '');
  const score = match.score ? `<div class="card-score"><b>${escapeHtml(match.score.home)}</b><span>—</span><b>${escapeHtml(match.score.away)}</b></div>` : '';

  return `
    <a class="live-card-link" href="/event/${eventId}" aria-label="Open ${escapeHtml(home.name)} versus ${escapeHtml(away.name)} event page">
      <article class="live-card team-match-card motion-${intensity} ${normalizedMoment ? momentClass(normalizedMoment) : ''}" style="${teamStyle(match.home)};--away-primary:${away.primary};--away-secondary:${away.secondary}" data-match-card data-intensity="${intensity}"${momentData}>
        <div class="card-top">
          <span class="live-dot ${match.isLive ? 'is-live' : 'is-up-next'}">${status}</span>
          <span>${escapeHtml(match.sport ?? 'Sport')} · ${competition}</span>
        </div>
        <div class="team-pair" aria-label="${escapeHtml(home.name)} versus ${escapeHtml(away.name)}">
          <div class="team team-home" style="${teamStyle(match.home)}">${teamBadge(match.home)}<strong>${escapeHtml(match.home)}</strong></div>
          ${score || '<div class="versus"><span>VS</span></div>'}
          <div class="team team-away" style="${teamStyle(match.away)}">${teamBadge(match.away)}<strong>${escapeHtml(match.away)}</strong></div>
        </div>
        ${moment}
        <div class="match-meta"><span>${note}</span><span>${escapeHtml(match.meta ?? 'Source pending')} ↗</span></div>
        <div class="card-sweep" aria-hidden="true"></div><div class="momentum-line" aria-hidden="true"><span></span></div>
      </article>
    </a>`;
}

export function renderMatchFeed(container, matches) {
  if (!container) return;
  container.innerHTML = matches.map(renderTeamMatchCard).join('');
}
