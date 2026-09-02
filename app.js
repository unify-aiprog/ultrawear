const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu');
const mobileNav = document.querySelector('.mobile-nav');
let lastScroll = 0;

// Sport cards are permanent sport home entry points, not section anchors.
const sportRoutes = Object.freeze({ football: '/football', basketball: '/basketball', tennis: '/tennis', running: '/running' });
document.querySelectorAll('.sport-grid .sport').forEach((link) => {
  const label = link.querySelector('b')?.textContent?.trim().toLowerCase();
  if (label && sportRoutes[label]) link.setAttribute('href', sportRoutes[label]);
});

// Hide the sticky header while scrolling down, but keep it visible at the top.
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  window.requestAnimationFrame(() => {
    const y = window.scrollY;
    if (y <= 20) header.style.transform = 'translateY(0)';
    else if (y > lastScroll + 4 && y > 100 && !mobileNav?.classList.contains('is-open')) header.style.transform = 'translateY(-100%)';
    else if (y < lastScroll - 4) header.style.transform = 'translateY(0)';
    lastScroll = y;
    ticking = false;
  });
  ticking = true;
}, { passive: true });

const setMenu = (open) => {
  if (!menuButton || !mobileNav) return;
  mobileNav.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('menu-open', open);
};
menuButton?.addEventListener('click', () => setMenu(!mobileNav?.classList.contains('is-open')));
mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });

const navLinks = [...document.querySelectorAll('.site-header nav a')];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
  sections.forEach((section) => observer.observe(section));
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target && target.id !== 'top') target.setAttribute('tabindex', '-1');
  });
});

const interestCooldown = 10 * 60 * 1000;
const interestKey = (id) => `uw-interest:${id}`;
document.addEventListener('click', (event) => {
  const target = event.target.closest?.('[data-interest-id]');
  if (!target) return;
  const entityId = decodeURIComponent(target.dataset.interestId || '');
  const entityType = decodeURIComponent(target.dataset.interestType || 'entity');
  const label = decodeURIComponent(target.dataset.interestLabel || entityId);
  if (!entityId) return;
  try {
    const last = Number(localStorage.getItem(interestKey(entityId)) || 0);
    if (Date.now() - last < interestCooldown) return;
    localStorage.setItem(interestKey(entityId), String(Date.now()));
  } catch {}
  fetch('/api/trending', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ entityId, entityType, label }), keepalive: true }).catch(() => {});
});
