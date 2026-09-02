import { getTeamVisual, teamStyle } from './identity.js';
import { getTeamLogo } from './logo-assets.js';
import { getSportVisual } from './sport-visuals-v1.js';
import { isHighValueMoment, momentClass, normalizeMoment } from './moments.js';

function escapeHtml(value) { return String(value ?? '').replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char])); }
function personId(person) { if (!person) return ''; if (typeof person === 'string') return person; return person.id ?? person.personId ?? person.playerId ?? person.athleteId ?? person.managerId ?? ''; }
function personType(person, fallback = 'person') { if (!person || typeof person === 'string') return fallback; return person.type ?? person.entityType ?? (person.managerId ? 'manager' : person.athleteId ? 'athlete' : person.playerId ? 'player' : fallback); }
function personLabel(person, fallback = '') { if (!person) return fallback; if (typeof person === 'string') return person; return person.name ?? person.fullName ?? person.displayName ?? fallback; }
function personTrigger(person, label = '', className = 'person-trigger') { const id = personId(person); if (!id) return escapeHtml(label || personLabel(person)); return `<button type="button" class="${className}" data-person-id="${escapeHtml(id)}" data-person-type="${escapeHtml(personType(person))}">${escapeHtml(label || personLabel(person))}</button>`; }
function teamBadge(code) { const visual = getTeamVisual(code); const logo = getTeamLogo(code); const logoMarkup = logo ? `<img class="team-logo" src="${escapeHtml(logo)}" alt="" loading="lazy" decoding="async" />` : `<span class="team-code">${escapeHtml(code)}</span>`; return `<span class="team-badge" style="${teamStyle(code)}" aria-label="${escapeHtml(visual.name)}">${logoMarkup}</span>`; }
function renderMoment(moment) { const normalized = normalizeMoment(moment); if (!normalized) return ''; const verifiedClass = normalized.verified ? ' is-verified' : ' is-demo'; const announce = isHighValueMoment(normalized) ? ' aria-live="polite"' : ''; const momentId = normalized.id ? ` data-moment-id="${escapeHtml(normalized.id)}"` : ''; const time = normalized.displayTime ?? (normalized.minute != null ? `${normalized.minute}'` : ''); return `<div class="match-moment ${momentClass(normalized)}${verifiedClass}"${announce}${momentId}><time class="moment-time">${escapeHtml(time)}</time><div><span class="moment-label">${escapeHtml(normalized.label)}</span>${normalized.detail ? `<span class="moment-detail">${escapeHtml(normalized.detail)}</span>` : ''}</div></div>`; }
function renderPeople(match) { const people = Array.isArray(match.people) ? match.people : []; if (!people.length) return ''; const triggers = people.map((person) => personTrigger(person)).filter(Boolean); return triggers.length ? `<div class="match-people" aria-label="People in this event">${triggers.join('')}</div>` : ''; }

export function renderTeamMatchCard(match) {
  const home = getTeamVisual(match.home), away = getTeamVisual(match.away), visual = getSportVisual(match.sport);
  const status = escapeHtml(match.statusLabel ?? 'UP NEXT'), competition = escapeHtml(match.competition ?? 'Sport'), note = escapeHtml(match.note ?? 'Verified live data will appear here');
  const intensity = escapeHtml(match.intensity ?? (match.isLive ? 'high' : 'low'));
  const moment = renderMoment(match.moment), normalizedMoment = normalizeMoment(match.moment);
  const momentData = normalizedMoment ? ` data-moment="${escapeHtml(normalizedMoment.type)}"` : '';
  const eventIdData = match.id ? ` data-event-id="${escapeHtml(match.id)}"` : '';
  const eventHref = match.id ? `/event/${encodeURIComponent(match.id)}` : '#';
  const score = match.score ? `<div class="card-score"><b>${escapeHtml(match.score.home)}</b><span>—</span><b>${escapeHtml(match.score.away)}</b></div>` : '';
  const people = renderPeople(match);
  const visualMarkup = visual.image ? `<div class="live-card-visual" style="--sport-image:url('${escapeHtml(visual.image)}');--sport-image-position:${escapeHtml(visual.focalPoint)}" aria-hidden="true"></div>` : '';
  return `<article class="live-card team-match-card motion-${intensity} ${normalizedMoment ? momentClass(normalizedMoment) : ''}" style="${teamStyle(match.home)};--away-primary:${away.primary};--away-secondary:${away.secondary}" data-match-card data-intensity="${intensity}"${eventIdData}${momentData}>${visualMarkup}<div class="card-top"><span class="live-dot ${match.isLive ? 'is-live' : 'is-up-next'}">${status}</span><span>${escapeHtml(match.sport ?? 'Sport')} · ${competition}</span></div><div class="team-pair" aria-label="${escapeHtml(home.name)} versus ${escapeHtml(away.name)}"><div class="team team-home" style="${teamStyle(match.home)}">${teamBadge(match.home)}<strong>${escapeHtml(match.home)}</strong></div>${score || '<div class="versus"><span>VS</span></div>'}<div class="team team-away" style="${teamStyle(match.away)}">${teamBadge(match.away)}<strong>${escapeHtml(match.away)}</strong></div></div>${people}${moment}<div class="match-meta"><span>${note}</span><a class="event-card-link" href="${eventHref}">Open match centre ↗</a></div><div class="card-sweep" aria-hidden="true"></div><div class="momentum-line" aria-hidden="true"><span></span></div></article>`;
}
export function renderMatchFeed(container, matches) { if (!container) return; container.innerHTML = matches.map(renderTeamMatchCard).join(''); }
