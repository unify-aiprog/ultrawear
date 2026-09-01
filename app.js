const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu');
const mobileNav = document.querySelector('.mobile-nav');
let lastScroll = 0;

// Hide the sticky header while scrolling down, but keep it visible at the top.
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  window.requestAnimationFrame(() => {
    const y = window.scrollY;
    if (y <= 20) {
      header.style.transform = 'translateY(0)';
    } else if (y > lastScroll + 4 && y > 100 && !mobileNav?.classList.contains('is-open')) {
      header.style.transform = 'translateY(-100%)';
    } else if (y < lastScroll - 4) {
      header.style.transform = 'translateY(0)';
    }
    lastScroll = y;
    ticking = false;
  });
  ticking = true;
}, { passive: true });

// Functional mobile navigation.
const setMenu = (open) => {
  if (!menuButton || !mobileNav) return;
  mobileNav.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('menu-open', open);
};

menuButton?.addEventListener('click', () => {
  setMenu(!mobileNav?.classList.contains('is-open'));
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});

// Keep the current section reflected in the desktop navigation.
const navLinks = [...document.querySelectorAll('.site-header nav a')];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle(
        'is-active',
        link.getAttribute('href') === `#${entry.target.id}`
      ));
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
  sections.forEach((section) => observer.observe(section));
}

// Smoothly return focus to the main content when using skip navigation.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target && target.id !== 'top') target.setAttribute('tabindex', '-1');
  });
});
