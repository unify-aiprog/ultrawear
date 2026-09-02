import { EVENT_DEMO_DATA } from './event-demo.js';
import { getTeamVisual } from './identity.js';
import { getTeamLogo } from './logo-assets.js';

const app = document.querySelector('#event-app');
const id = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');
const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c]));

function teamCode(team) {
  return team?.code || team?.shortName || team?.abbreviation || team?.id || '';
}

function teamLabel(team) {
  return team?.name || teamCode(team);
}

function badge(team) {
  const code = teamCode(team);
  getTeamVisual(code);
  const logo = getTeamLogo(code);
  return logo
    ? `<img class="team-logo" src="${esc(logo)}" alt="" width="52" height="52" />`
    : `<span class="team-code">${esc(code)}</span>`;
}

function statusLabel(event) {
  if (event.status === 'live') {
    const minute = event.minute ?? null;
    return minute != null ? `LIVE · ${esc(minute)}'` : 'LIVE';
  }
  if (event.status === 'halftime') return 'HALF TIME';
  if (event.status === 'finished') return 'FULL TIME';
  if (event.status === 'postponed') return 'POSTPONED';
  if (event.status === 'cancelled') return 'CANCELLED';
  return 'UP NEXT';
}

function normalizeStats(event) {
  return Array.isArray(event.stats) ? event.stats : [];
}

function normalizeMoments(event) {
  if (Array.isArray(event.moments)) return event.moments;
  return event.moment ? [{
    time: event.moment.timestamp || '',
    title: event.moment.type || 'Match moment',
    detail: event.moment.team || '',
    type: event.moment.type || 'moment',
  }] : [];
}

function verificationClass(record) {
  return record?.verification === 'conflicted' ? 'conflicted'
    : record?.verification === 'verified' ? 'verified'
    : record?.verification === 'corroborated' ? 'corroborated'
    : 'unverified';
}

function verificationLabel(record) {
  if (!record) return 'Building signal';
  if (record.verification === 'conflicted') return 'Conflicted';
  if (record.verification === 'verified') return 'Verified';
  if (record.verification === 'corroborated') return 'Corroborated';
  return 'Unverified';
}

function verificationSummary(records) {
  const latest = new Map();
  for (const record of records || []) {
    if (!latest.has(record.field)) latest.set(record.field, record);
  }
  const ordered = [...latest.values()];
  if (!ordered.length) return '<span class="verification-chip neutral">Building signal</span>';
  return ordered.map((record) => `<span class="verification-chip ${verificationClass(record)}"><b>${esc(verificationLabel(record))}</b><small>${esc(record.field)}</small></span>`).join('');
}

function formatValue(value) {
  if (value == null) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function verificationPanel(records, loading = false) {
  if (loading) return '<section class="event-panel verification-panel" id="verification"><div class="verification-heading"><div><p class="eyebrow">CANONICAL DATA</p><h2>Verification</h2></div></div><p>Loading provenance…</p></section>';
  const items = Array.isArray(records) ? records : [];
  if (!items.length) return '<section class="event-panel verification-panel" id="verification"><div class="verification-heading"><div><p class="eyebrow">CANONICAL DATA</p><h2>Verification</h2></div></div><p>No verification history has been published for this event yet.</p></section>';
  const latest = new Map();
  for (const record of items) if (!latest.has(record.field)) latest.set(record.field, record);
  const summary = [...latest.values()].map((record) => `<span class="verification-chip ${verificationClass(record)}"><b>${esc(verificationLabel(record))}</b><small>${esc(record.field)}</small></span>`).join('');
  return `<section class="event-panel verification-panel" id="verification">
    <div class="verification-heading"><div><p class="eyebrow">CANONICAL DATA</p><h2>Verification</h2></div><div class="verification-summary">${summary}</div></div>
    <p class="verification-intro">Every canonical fact keeps its source observations and transition history.</p>
    <div class="verification-history">${items.map((record) => `<details class="verification-record"><summary><span class="verification-chip ${verificationClass(record)}">${esc(verificationLabel(record))}</span><strong>${esc(record.field)}</strong><time>${esc(record.observedAt)}</time></summary><div class="verification-detail"><p><b>${esc(record.action)}</b>${record.reason ? ` · ${esc(record.reason)}` : ''}</p><dl><div><dt>Previous</dt><dd>${esc(formatValue(record.previousValue))}</dd></div><div><dt>Current</dt><dd>${esc(formatValue(record.value))}</dd></div><div><dt>Previous verification</dt><dd>${esc(record.previousVerification || '—')}</dd></div><div><dt>Source</dt><dd>${esc(record.sourceId)}</dd></div><div><dt>Sources supporting fact</dt><dd>${esc((record.sources || []).join(', ') || '—')}</dd></div></dl></div></details>`).join('')}</div>
  </section>`;
}

function renderEvent(event, { fallback = false, verificationRecords = [] } = {}) {
  const label = statusLabel(event);
  const moments = normalizeMoments(event);
  const stats = normalizeStats(event);
  const score = event.score && event.score.home != null && event.score.away != null
    ? `<div class="event-score"><span>${esc(event.score.home)} — ${esc(event.score.away)}</span><small>${label}</small></div>`
    : `<div class="event-score"><span>VS</span><small>${label}</small></div>`;
  const venue = typeof event.venue === 'object' ? event.venue?.name : event.venue;
  const source = typeof event.source === 'object' ? event.source?.provider || event.source?.id : event.source;

  app.innerHTML = `
    <div class="event-shell">
      <a class="event-back" href="/#live">← Back to live sport</a>
      <section class="event-hero">
        <div class="event-kicker"><span>${esc(event.sport)} · ${esc(event.competition)}</span><strong class="event-status ${event.status === 'live' ? 'live' : ''}">${label}</strong></div>
        <div class="event-scoreboard">
          <div class="event-team">${badge(event.home)}<span>${esc(teamLabel(event.home))}</span></div>
          ${score}
          <div class="event-team away"><span>${esc(teamLabel(event.away))}</span>${badge(event.away)}</div>
        </div>
        <div class="event-meta"><span>📍 ${esc(venue || 'Venue TBC')}</span><span>Data source: ${esc(source || 'Awaiting verified source')}</span><span>Last updated: ${esc(event.updatedAt || 'Not yet')}</span></div>
        <div class="event-live-note">${fallback ? 'Preview event: canonical event store unavailable in this environment.' : (event.status === 'live' || event.status === 'halftime' ? 'Live data is read from the canonical event store. This page refreshes while the event is active.' : 'This event URL persists after the event and becomes the historical match centre automatically.')}</div>
        <div class="event-verification-strip" aria-label="Canonical verification status">${verificationSummary(verificationRecords)}</div>
      </section>
      <nav class="event-nav" aria-label="Event sections"><a href="#timeline">Timeline</a><a href="#stats">Stats</a><a href="#verification">Verification</a><a href="#community">Community</a><a href="#related">Related</a></nav>
      <div class="event-grid">
        <section class="event-panel" id="timeline"><h2>Live moments</h2>${moments.length ? moments.map(m => `<div class="event-moment"><time>${esc(m.time || '')}</time><div><strong>${esc(m.title || m.type || 'Match moment')}</strong><span>${esc(m.detail || '')}</span></div></div>`).join('') : '<p>No moments published yet.</p>'}</section>
        <section class="event-panel" id="stats"><h2>Match stats</h2>${stats.length ? `<table class="event-stats"><tbody>${stats.map(s => `<tr><td>${esc(s[0])}</td><td>${esc(s[1])}</td><td>${esc(s[2])}</td></tr>`).join('')}</tbody></table>` : '<p>Stats will appear when the verified provider supplies them.</p>'}</section>
        ${verificationPanel(verificationRecords)}
        <section class="event-panel" id="community"><h2>For community</h2><p>Reactions, questions, polls, predictions and follows belong to the event itself — not to a temporary live page.</p></section>
        <section class="event-panel" id="related"><h2>Related</h2><p>Team stories, competition context, player profiles and post-match content will attach here through Content Core.</p></section>
      </div>
    </div>`;
}

async function fetchCanonicalEvent() {
  const response = await fetch(`/api/events/${encodeURIComponent(id)}`, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) return null;
  const payload = await response.json();
  return payload?.event || null;
}

async function fetchVerification() {
  const response = await fetch(`/api/events/${encodeURIComponent(id)}/verification?limit=50`, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) return [];
  const payload = await response.json();
  return Array.isArray(payload?.records) ? payload.records.reverse() : [];
}

async function refresh({ initial = false } = {}) {
  if (initial) app.innerHTML = '<div class="event-loading">Loading event centre…</div>';

  try {
    const [event, verificationRecords] = await Promise.all([fetchCanonicalEvent(), fetchVerification()]);
    if (event) {
      renderEvent(event, { verificationRecords });
      if (event.status === 'live' || event.status === 'halftime') window.setTimeout(() => refresh(), 10000);
      return event;
    }
  } catch (_) {
    // Preserve the previous rendered snapshot during transient polling failures.
  }

  const demo = EVENT_DEMO_DATA[id];
  if (demo && initial) {
    renderEvent(demo, { fallback: true });
    if (demo.status === 'live' || demo.status === 'halftime') window.setTimeout(() => refresh(), 10000);
    return demo;
  }

  if (initial) app.innerHTML = `<div class="event-empty"><h1>Event not found</h1><p>This event has not been published to the canonical event store.</p><a href="/">← Back to UltraWear FC</a></div>`;
  return null;
}

refresh({ initial: true });
