const VISUALS = Object.freeze({
  football: Object.freeze({ image: 'https://images.unsplash.com/photo-1777715329470-49ee046dd186?auto=format&fit=crop&fm=jpg&q=84&w=2200', alt: 'Football stadium filled with supporters in dramatic natural light.', credit: 'Tanya Barrow / Unsplash', focalPoint: '50% 48%' }),
  basketball: Object.freeze({ image: 'https://images.unsplash.com/photo-1752166673475-87d26dda9195?auto=format&fit=crop&fm=jpg&q=82&w=1600', alt: 'Basketball game in a crowded indoor arena.', credit: 'Luke Miller / Unsplash', focalPoint: '50% 42%' }),
  tennis: Object.freeze({ image: 'https://images.unsplash.com/photo-1758347101935-819bc6feeace?auto=format&fit=crop&fm=jpg&q=82&w=1600', alt: 'Tennis player with racket on a blue court.', credit: 'Brooke Balentine / Unsplash', focalPoint: '50% 42%' }),
  running: Object.freeze({ image: 'https://images.unsplash.com/photo-1744060204728-f68e434a3edf?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1800', alt: 'Runner sprinting on a track in golden sunlight.', credit: 'Jorge Alberto Vega Barrera / Unsplash', focalPoint: '52% 48%' }),
});

const FALLBACK = Object.freeze({ image: '', alt: 'Live sport atmosphere.', credit: '', focalPoint: '50% 50%' });

export function getSportVisual(sport) {
  return VISUALS[String(sport ?? '').trim().toLowerCase()] ?? FALLBACK;
}

export function sportVisualStyle(sport) {
  const visual = getSportVisual(sport);
  return visual.image ? `--sport-image:url("${visual.image}");--sport-image-position:${visual.focalPoint};` : '';
}
