const VISUALS = Object.freeze({
  football: {
    src: 'https://images.unsplash.com/photo-1777715329470-49ee046dd186?auto=format&fit=crop&fm=jpg&q=82&w=2200',
    alt: 'Football stadium filled with supporters in dramatic natural light.',
    credit: 'Tanya Barrow / Unsplash',
    focal: '50% 58%',
  },
  basketball: {
    src: 'https://images.unsplash.com/photo-1752166673475-87d26dda9195?auto=format&fit=crop&fm=jpg&q=82&w=2200',
    alt: 'Basketball game in a crowded indoor arena.',
    credit: 'Luke Miller / Unsplash',
    focal: '54% 58%',
  },
  tennis: {
    src: 'https://images.unsplash.com/photo-1758347101935-819bc6feeace?auto=format&fit=crop&fm=jpg&q=82&w=2200',
    alt: 'Tennis player with racket on a blue court.',
    credit: 'Brooke Balentine / Unsplash',
    focal: '50% 50%',
  },
  running: {
    src: 'https://images.unsplash.com/photo-1744060204728-f68e434a3edf?auto=format&fit=crop&fm=jpg&q=82&w=2200',
    alt: 'Runner moving through warm evening light on a trackside road.',
    credit: 'Jorge Alberto Vega Barrera / Unsplash',
    focal: '52% 52%',
  },
});

const sport = window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase() || 'football';
const visual = VISUALS[sport];

if (visual) {
  const hero = document.querySelector('#sport-hero-image');
  const heroLink = document.querySelector('#sport-hero-link');
  const credit = document.querySelector('#sport-image-credit');
  const storyImages = document.querySelectorAll('.sport-story-image img');

  if (hero) {
    hero.src = visual.src;
    hero.alt = visual.alt;
    hero.style.objectPosition = visual.focal;
  }
  if (heroLink) heroLink.href = visual.src;
  if (credit) credit.textContent = visual.credit;
  storyImages.forEach((image, index) => {
    image.src = visual.src;
    image.alt = visual.alt;
    image.style.objectPosition = index === 0 ? visual.focal : `${index * 24 + 20}% 50%`;
  });

  document.documentElement.dataset.sportVisual = sport;
}
