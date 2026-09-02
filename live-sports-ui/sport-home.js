const SPORTS = Object.freeze({
  football: {
    name: 'Football',
    mark: 'FB',
    psychology: 'Collective emotion, rivalry, belonging and the drama of the moment.',
    lede: 'The game where one moment can belong to everyone.',
    headline: 'Football is never just 90 minutes.',
    story: 'Rivalries, rituals, personalities, pressure and the moments that turn a match into memory.',
    liveState: 'FEEL EVERY MOMENT.',
    liveDescription: 'Live scores, match moments and the stories building around them.',
    latest: [
      ['01', 'The game has a pulse.', 'Follow the momentum, the turning points and the details that change how a match feels.'],
      ['02', 'Rivalry runs deeper.', 'Teams, players, managers and histories give every fixture a reason to matter.'],
      ['03', 'Moments become memory.', 'Goals, cards, substitutions and decisions become part of the story people carry with them.'],
    ],
    stories: [
      ['01', 'THE MATCH IS THE STORY.', 'Context, tension and the people behind the result.'],
      ['02', 'WHO CHANGES THE GAME?', 'Players, managers and matchups with something to prove.'],
      ['03', 'WHY THIS MOMENT MATTERS.', 'The action, the reaction and the history it joins.'],
    ],
    community: 'Football creates belonging at full volume. Different shirts, different cities, one shared feeling.',
  },
  basketball: {
    name: 'Basketball',
    mark: 'BB',
    psychology: 'Expression, rhythm, confidence, improvisation and momentum.',
    lede: 'A game built on rhythm, reaction and fearless expression.',
    headline: 'Basketball moves before you can look away.',
    story: 'Runs, rivalries, handles, pressure shots and personalities moving the game from one possession to the next.',
    liveState: 'STAY WITH THE RUN.',
    liveDescription: 'Live scores, momentum shifts and verified moments from the court.',
    latest: [
      ['01', 'Momentum is everything.', 'A game can flip in seconds. Follow the runs, the pressure and the response.'],
      ['02', 'Expression is part of the game.', 'Players make basketball personal through style, skill, confidence and creativity.'],
      ['03', 'Every possession counts.', 'Big shots, defensive stops and late-game decisions shape the story.'],
    ],
    stories: [
      ['01', 'WATCH THE GAME CHANGE.', 'Runs, matchups and the moments that swing a night.'],
      ['02', 'WHO HAS THE COURT?', 'Players and personalities setting the rhythm.'],
      ['03', 'PLAY IT BACK.', 'The shots, plays and decisions worth remembering.'],
    ],
    community: 'Basketball is expression in motion. Different styles, different courts, one culture that keeps moving.',
  },
  tennis: {
    name: 'Tennis',
    mark: 'TN',
    psychology: 'Mental endurance, personal rivalry, precision, tension and the courage to play alone.',
    lede: 'One court. One opponent. A thousand decisions.',
    headline: 'Tennis is the conversation between pressure and belief.',
    story: 'Rivalries, resilience, tactics, momentum and the small decisions that reveal who can stay present.',
    liveState: 'POINT BY POINT.',
    liveDescription: 'Live matches, turning points and verified moments from the court.',
    latest: [
      ['01', 'The pressure is personal.', 'Every point asks a player to reset, decide and commit again.'],
      ['02', 'Rivalries are built slowly.', 'Head-to-head history, surfaces, styles and belief shape what happens next.'],
      ['03', 'Small moments decide big days.', 'Break points, tiebreaks, double faults and comebacks can rewrite a match.'],
    ],
    stories: [
      ['01', 'THE NEXT POINT.', 'What changes when the pressure arrives?'],
      ['02', 'RIVALRY, UP CLOSE.', 'Players, patterns and the histories between them.'],
      ['03', 'THE MOMENT OF BELIEF.', 'Comebacks, breakthroughs and the points nobody forgets.'],
    ],
    community: 'Tennis is individual on court and shared everywhere else. We follow the fight, the craft and the people around it.',
  },
  running: {
    name: 'Running',
    mark: 'RN',
    psychology: 'Self-mastery, progress, discipline, freedom and the community found in movement.',
    lede: 'The race is against the clock. The journey is against yourself.',
    headline: 'Running is what happens when progress becomes a habit.',
    story: 'Races, splits, personal bests, records and the quiet work that turns effort into movement.',
    liveState: 'KEEP MOVING.',
    liveDescription: 'Race results, splits, milestones and verified moments from the road and track.',
    latest: [
      ['01', 'Progress leaves a mark.', 'Personal bests and small gains tell the story behind the finish time.'],
      ['02', 'Every pace has a purpose.', 'Training, tactics, conditions and endurance change what a race demands.'],
      ['03', 'The finish is not the whole story.', 'Athletes, communities and milestones make every race bigger than the clock.'],
    ],
    stories: [
      ['01', 'FIND YOUR PACE.', 'Races, training and the rhythms that keep athletes moving.'],
      ['02', 'WHO IS RISING?', 'Athletes, breakthroughs and performances worth watching.'],
      ['03', 'MORE THAN A FINISH TIME.', 'The people, milestones and stories behind the result.'],
    ],
    community: 'Running turns individual effort into collective energy. Every pace belongs somewhere in the community.',
  },
});

const pathSport = window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase() || 'football';
const sport = SPORTS[pathSport] || {
  name: pathSport.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  mark: 'UW',
  psychology: 'Movement, identity, competition and community.',
  lede: 'A dedicated home for the sport and the people who shape it.',
  headline: 'The sport, beyond the score.',
  story: 'Live action, intelligence, culture and community around the game.',
  liveState: 'THE ACTION, LIVE.',
  liveDescription: 'Verified live events for this sport.',
  latest: [
    ['01', 'The sport has a pulse.', 'Follow the latest action, people and stories.'],
    ['02', 'The people make it.', 'Discover athletes, teams, moments and rivalries.'],
    ['03', 'Built for the community.', 'Every result becomes part of a wider sporting story.'],
  ],
  stories: [
    ['01', 'THE SPORT BEYOND THE SCORE.', 'Culture, context and the people shaping it.'],
    ['02', 'WHAT TO WATCH.', 'Key events, athletes and matchups worth following.'],
    ['03', 'MOMENTS THAT MATTER.', 'Verified events become part of a persistent sports history.'],
  ],
  community: 'Every sport has its own language. Every sport still belongs to the same community.',
};

document.title = `UltraWear FC — ${sport.name}`;
const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) metaDescription.setAttribute('content', `${sport.name}: ${sport.lede} ${sport.story}`);

const setText = (selector, value) => {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
};

setText('#sport-eyebrow', sport.name.toUpperCase());
setText('#sport-title', `${sport.name.toUpperCase()}.`);
setText('#sport-lede', sport.lede);
setText('#sport-mark', sport.mark);
setText('#live-sport-name', sport.name.toUpperCase());
setText('#live-state', sport.liveState);
setText('#latest-headline', sport.headline);
setText('#latest-copy', sport.story);
setText('#story-one', sport.stories[0][1]);
setText('#live-description', sport.liveDescription);
setText('#community-copy', sport.community);

const latestCards = document.querySelectorAll('.sport-panels article');
sport.latest.forEach(([index, title, copy], position) => {
  const card = latestCards[position];
  if (!card) return;
  setText('.panel-index', index, card);
  setText('h3', title, card);
  setText('p', copy, card);
});

const storyCards = document.querySelectorAll('.sport-story-grid article');
sport.stories.forEach(([index, title, copy], position) => {
  const card = storyCards[position];
  if (!card) return;
  setText('span', index, card);
  setText('h3', title, card);
  setText('p', copy, card);
});

let stopMomentObserver = () => {};

async function loadLive() {
  const grid = document.querySelector('#sport-live-grid');
  const status = document.querySelector('#feed-status');
  const state = document.querySelector('#live-state');
  const description = document.querySelector('#live-description');
  if (!grid) return;
  try {
    const response = await fetch(`/api/sports/live?sport=${encodeURIComponent(pathSport)}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error('feed unavailable');
    const data = await response.json();
    if (data?.verified && Array.isArray(data.events) && data.events.length) {
      const { renderMatchFeed } = await import('./render.js');
      const { observeMomentFeed } = await import('./moment-engine.js');
      renderMatchFeed(grid, data.events.map((event) => ({
        ...event,
        home: event.home?.shortName || event.home?.name || event.home?.id || 'HOME',
        away: event.away?.shortName || event.away?.name || event.away?.id || 'AWAY',
        statusLabel: event.status === 'halftime' ? 'HALFTIME' : 'LIVE',
        isLive: true,
        intensity: 'high',
        note: 'Verified sports feed',
        meta: 'Open match centre',
      })));
      stopMomentObserver();
      stopMomentObserver = observeMomentFeed(grid);
      setText('#feed-status', `${data.events.length} LIVE EVENT${data.events.length === 1 ? '' : 'S'} ↗`);
      setText('#live-state', sport.liveState);
      setText('#live-description', sport.liveDescription);
      return;
    }
  } catch {}
  stopMomentObserver();
  grid.innerHTML = `<article class="live-card featured loading-card"><div class="card-top"><span class="live-dot">FEED READY</span><span>${sport.name} · Preview</span></div><div class="score"><strong>NO LIVE</strong><b>—</b><strong>YET</strong></div><div class="match-meta"><span>Verified live data will appear here.</span><span>UltraWear</span></div></article>`;
  setText('#feed-status', 'BUILDING THE FEED ↗');
  setText('#live-state', 'WAITING FOR VERIFIED ACTION.');
  setText('#live-description', sport.liveDescription);
}

loadLive();
window.setInterval(loadLive, 10000);
