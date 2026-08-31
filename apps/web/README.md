# UltraWear Sports Web Shell

Foundation for the fan-first sports platform. The fashion/product arm is intentionally out of scope for this application.

## UX principles

- Live information is immediately visible.
- Fans reach scores, news and matches in one or two interactions.
- Mobile-first responsive layout.
- Dense enough for sports utility, spacious enough for editorial discovery.
- Clear hierarchy between live, breaking, featured and evergreen content.
- Accessible keyboard navigation and semantic HTML.
- Fast loading with progressive enhancement.
- Components are reusable across football, basketball, tennis, cricket, combat sports, esports and future sports.

## Planned navigation

Home · Live · Scores · News · Sports · Explore · Me

## Component foundations

The implementation should establish reusable primitives for:

- App shell
- Header/navigation
- Mobile bottom navigation
- Sport switcher
- Live indicator
- Match card
- Competition card
- Team/player identity row
- News card
- Breaking-news banner
- Score strip
- Section header
- Empty/loading/error states
- Skeletons
- Toast/notification surface
- Responsive containers

Keep domain data separate from presentation components. Components should accept typed props and should not fetch sports-provider data directly.
