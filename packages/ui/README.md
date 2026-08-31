# UltraWear UI Foundation

Reusable design-system contract for the sports platform.

## Tokens

Define tokens for:

- typography scale
- spacing scale
- radii
- elevation
- borders
- motion durations/easing
- content widths
- breakpoints
- semantic states: live, success, warning, danger, muted

Do not hard-code sport-specific colors into components. Sports/competition branding belongs to data-driven theme slots.

## Accessibility

Target WCAG 2.2 AA. Components must expose semantic labels, visible focus states, keyboard operation, reduced-motion support and sufficient contrast.

## Interaction principles

- Live updates should be noticeable without being distracting.
- Motion should communicate state changes, not decorate every interaction.
- Touch targets should be comfortable on mobile.
- Critical match state should remain readable during rapid updates.

## Component API rule

Presentation components must remain provider-agnostic and data-source-agnostic. Use typed props/view models. Fetching, mutation and business rules belong outside the UI package.
