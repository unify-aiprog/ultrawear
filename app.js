const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu');
const mobileNav = document.querySelector('.mobile-nav');
let lastScroll = 0;

const sportRoutes = Object.freeze({ football: '/football', basketball: '/basketball', tennis: '/tennis', running: '/running' });
document.querySelectorAll('.sport-grid .sport').forEach((link) => {
  const label = link.querySelector('b')?.textContent?.trim().toLowerCase();
  if (label && sportRoutes[label]) link.setAttribute('href', sportRoutes[label]);
});

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  window.requestAnimationFrame(() => {
    const y = window.scrollY;
    if (y <= 20) header.style.transform = 'translateY(0)';
    else if (y > lastScroll + 4 && y > 100 && !mobileNav?.classList.contains('is-open')) header.style.transform = 'translateY(-100%)';
    else if (y < lastScroll - 4) header.style.transform = 'translateY(0)';
    lastScroll = y; ticking = false;
  }); ticking = true;
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

// Player/athlete/manager identity uses one reusable modal, so the graph can scale without a page per person.
import('./live-sports-ui/person-modal.js').then(({ bindPersonModals }) => bindPersonModals()).catch(() => {});
