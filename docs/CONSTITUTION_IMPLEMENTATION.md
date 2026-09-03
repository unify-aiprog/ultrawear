# UltraWear FC Constitutional Implementation

This document maps the Web Constitution to executable repository controls. A principle is not considered implemented merely because it appears in documentation.

| Ship Gate | Repository control | Current status |
| --- | --- | --- |
| Community | Community/product requirements remain explicit; community features add moderation and contribution controls | Enforced foundation |
| Utility | Primary routes, empty states and destination checks are enforced by `constitution:check` | Enforced baseline |
| Trust | Content fact firewall + evidence contracts; sports observations carry source, timestamp, confidence, freshness and verification state | Enforced foundation + persistent revalidation service |
| Experience | App shell, error boundary, responsive styles and route checks | Enforced baseline; runtime UX testing remains |
| Accessibility | Skip link, visible focus and reduced-motion rules are checked in CI | Enforced baseline; automated browser audit remains |
| Integrity | Unsupported/low-confidence/conflicted claims cannot pass the fact firewall | Enforced in Content Core primitives |
| Architecture | Sports domain contracts are provider-neutral and model entities/events independently of vendors | Enforced foundation |
| Brand | FC = For Community and sports/lifestyle positioning are part of the app shell and constitution | Enforced |
| Future | Sports contracts accept additional sports without changing the core entity/event vocabulary | Enforced foundation; additional sport adapters remain |
| Reality | Internal destination checks + production build run in CI | Enforced baseline |

## Non-negotiable rules

1. A sports fact must have provenance before it is treated as verified.
2. Conflicting observations resolve to `conflicted`, never to a guessed value.
3. Stale or expired observations cannot become publishable values.
4. Content claims without supporting evidence remain unsupported and require review.
5. Provider-specific adapters must terminate at the provider-neutral domain layer.
6. Accessibility regressions in focus or reduced-motion behavior fail the constitutional check.
7. CI must run the constitutional check, content trust tests, sports trust tests, platform trust tests, type checking and the production build.
8. Continuous sports revalidation must use an authenticated endpoint and never silently run in production without a configured secret.

## Remaining production work

- Apply `supabase/constitutional-platform.sql` to the production Supabase project and verify the migrations against the deployed schema.
- Add more lawful free/open provider adapters; football-data.org is the first adapter and commercial providers remain optional.
- Expand revalidation from match events to standings, squads, competitions and other canonical entities.
- Add browser-level accessibility/performance tests and runtime empty/error-state verification.
- Connect real trend sources and analytics/advertising providers only behind the consent contracts.
- Finish product UI around the canonical data/content layers.

These are live integration/product backlogs, not permissions to bypass the Ship Gate.
