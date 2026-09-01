const header = document.querySelector('.site-header');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  header.style.transform = y > lastScroll && y > 100 ? 'translateY(-100%)' : 'translateY(0)';
  header.style.transition = 'transform .25s ease';
  lastScroll = y;
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.menu')?.blur();
  });
});
