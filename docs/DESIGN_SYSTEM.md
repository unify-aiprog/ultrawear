# UltraWear Sports Design System

## Product character

Fast, energetic, trustworthy, fan-first and information-rich. The interface should feel like a live sports destination rather than a generic news CMS.

## Layout

- Mobile-first.
- Fluid content containers.
- Sticky contextual navigation where it improves live use.
- Desktop multi-column layouts for live scores/news/discovery.
- Avoid excessive chrome around high-frequency information.

## Typography

Use a highly legible sans-serif family with a strong display treatment for scores/headlines. Numeric score typography should support tabular figures where available.

## Color architecture

Use semantic tokens rather than component-specific colors. Required semantic roles include background, surface, elevated surface, text, muted text, border, accent, live, success, warning and danger. Competition/team colors are optional data-driven accents and must not break accessibility.

## Cards

Cards should prioritize scanability: identity → state → primary information → action. Avoid excessive shadows and decorative elements that compete with scores or headlines.

## Motion

Use short state-transition animations for live scores, goal/event changes and navigation. Respect `prefers-reduced-motion`.

## Responsive behavior

The same domain object should have compact, standard and expanded presentation variants rather than separate business logic for mobile and desktop.

## Accessibility

Semantic landmarks, headings, labels, focus management, keyboard support, reduced motion and WCAG 2.2 AA contrast are mandatory foundations.
