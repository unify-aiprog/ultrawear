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
    moment: event.moment ? { ...event.moment } : null,
    note: 'Verified sports feed',
    meta: event.updatedAt ? `Updated ${new Date(event.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Verified feed',
  };
}

function momentKey(moment, eventId) {
  if (!moment) return null;
  return `${eventId}:${moment.id ?? `${moment.type}:${moment.occurredAt ?? moment.timestamp ?? moment.minute ?? ''}`}`;
}

function animateNewMoments(container, previousKeys) {
  const currentKeys = new Set();
  container.querySelectorAll('[data-match-card]').forEach((card) => {
    const eventId = card.dataset.eventId || '';
    const moment = card.querySelector('[data-moment-id]');
    if (!moment) return;
    const key = momentKey({ id: moment.dataset.momentId, type: card.dataset.moment }, eventId);
    if (!key) return;
    currentKeys.add(key);
    if (!previousKeys.has(key)) {
      moment.classList.add('moment-enter');
      window.setTimeout(() => moment.classList.remove('moment-enter'), 900);
    }
  });
  return currentKeys;
}

function isLocalPreview() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

function renderFeedStatus(container, message) {
  container.innerHTML = `<div class="live-feed-status" role="status"><span>${message}</span></div>`;
}

async function getEvents() {
  const url = `/api/sports/live?refresh=${Date.now()}`;
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'cache-control': 'no-cache' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Feed unavailable: ${response.status}`);
  const data = await response.json();
  return { events: Array.isArray(data?.events) ? data.events : [], verified: data?.verified === true };
}

let sharedRequest = null;
async function fetchVerifiedEvents() {
  if (!sharedRequest) {
    sharedRequest = getEvents().finally(() => { sharedRequest = null; });
  }
  return sharedRequest;
}

export function createLiveFeedController(container) {
  let knownMomentKeys = new Set();

  return Object.freeze({
    async refresh() {
      if (!container) return { verified: false, count: 0 };
      try {
        const { events, verified } = await fetchVerifiedEvents();
        if (verified && events.length) {
          renderMatchFeed(container, events.map(toCard));
          knownMomentKeys = animateNewMoments(container, knownMomentKeys);
          return { verified: true, count: events.length };
        }
        if (isLocalPreview()) {
          renderMatchFeed(container, DEMO_MATCHES);
        } else {
          renderFeedStatus(container, 'No verified live events right now.');
        }
      } catch {
        if (isLocalPreview()) {
          renderMatchFeed(container, DEMO_MATCHES);
        } else {
          renderFeedStatus(container, 'Live sports feed temporarily unavailable.');
        }
      }
      knownMomentKeys = new Set();
      return { verified: false, count: 0 };
    },
  });
}

export function createLiveSpotlightController(container) {
  let knownMomentKeys = new Set();

  return Object.freeze({
    async refresh() {
      if (!container) return { verified: false, count: 0 };
      try {
        const { events, verified } = await fetchVerifiedEvents();
        if (verified && events.length) {
          renderMatchFeed(container, [toCard(events[0])]);
          knownMomentKeys = animateNewMoments(container, knownMomentKeys);
          return { verified: true, count: 1, sport: events[0].sport };
        }
        if (isLocalPreview()) {
          renderMatchFeed(container, DEMO_MATCHES.slice(0, 1));
        } else {
          renderFeedStatus(container, 'No verified live event right now.');
        }
      } catch {
        if (isLocalPreview()) {
          renderMatchFeed(container, DEMO_MATCHES.slice(0, 1));
        } else {
          renderFeedStatus(container, 'Live spotlight temporarily unavailable.');
        }
      }
      knownMomentKeys = new Set();
      return { verified: false, count: 0, sport: isLocalPreview() ? DEMO_MATCHES[0]?.sport : undefined };
    },
  });
}

const defaultControllers = new WeakMap();
const spotlightControllers = new WeakMap();

export async function loadVerifiedLiveFeed(container) {
  if (!container) return { verified: false, count: 0 };
  let controller = defaultControllers.get(container);
  if (!controller) {
    controller = createLiveFeedController(container);
    defaultControllers.set(container, controller);
  }
  return controller.refresh();
}

export async function loadVerifiedLiveSpotlight(container) {
  if (!container) return { verified: false, count: 0 };
  let controller = spotlightControllers.get(container);
  if (!controller) {
    controller = createLiveSpotlightController(container);
    spotlightControllers.set(container, controller);
  }
  return controller.refresh();
}
