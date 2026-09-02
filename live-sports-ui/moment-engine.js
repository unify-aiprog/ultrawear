import { normalizeMoment, momentClass } from './moments.js';

const seen = new Set();

function motionAllowed() {
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function keyFor(moment) {
  const normalized = normalizeMoment(moment);
  return normalized?.id || [normalized?.type, normalized?.occurredAt, normalized?.team, normalized?.player].join(':');
}

export function animateMomentElement(element, { force = false } = {}) {
  if (!element) return false;
  const key = element.dataset.momentId || `${element.dataset.moment || ''}:${element.textContent}`;
  if (!force && seen.has(key)) return false;
  seen.add(key);
  if (!motionAllowed()) return false;
  element.classList.remove('moment-enter');
  void element.offsetWidth;
  element.classList.add('moment-enter');
  return true;
}

export function animateNewMoments(root = document, { force = false } = {}) {
  const elements = root.querySelectorAll?.('.match-moment[data-moment-id], .match-moment[data-moment]') || [];
  let animated = 0;
  elements.forEach((element) => {
    if (animateMomentElement(element, { force })) animated += 1;
  });
  return animated;
}

export function observeMomentFeed(container, { initial = false } = {}) {
  if (!container) return () => {};
  if (initial) animateNewMoments(container);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes?.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.matches?.('.match-moment')) animateMomentElement(node);
        animateNewMoments(node);
      });
    }
  });
  observer.observe(container, { childList: true, subtree: true });
  return () => observer.disconnect();
}

export function resetMomentAnimationState() {
  seen.clear();
}

export function momentAnimationClass(moment) {
  const normalized = normalizeMoment(moment);
  return normalized ? `moment-enter ${momentClass(normalized)}` : '';
}
