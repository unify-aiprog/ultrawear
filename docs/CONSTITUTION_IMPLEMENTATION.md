# UltraWear FC Constitutional Implementation

This document maps the Web Constitution to executable repository controls. It is intentionally operational: a principle is not considered implemented merely because it appears in documentation.

| Ship Gate | Repository control | Current status |
| --- | --- | --- |
| Community | Community/product requirements remain explicit; community features must add moderation and contribution controls before launch | Foundation / feature work remains |
| Utility | Primary routes, empty states and destination checks are enforced by `constitution:check` | Enforced baseline |
| Trust | Content fact firewall + evidence contracts; sports observations carry source, timestamp, confidence and verification state | Enforced primitives; persistence/reconciliation service remains P0 |
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
3. Stale-only observations produce `insufficient_evidence` rather than a published value.
4. Content claims without supporting evidence remain unsupported and require review.
5. Provider-specific adapters must terminate at the provider-neutral domain layer.
6. Accessibility regressions in focus or reduced-motion behavior fail the constitutional check.
7. CI must run the constitutional check, content trust tests, sports trust tests, type checking and the production build.

## Remaining P0 work

The next implementation layer is persistence and continuous operation of the sports trust model: source observations, deterministic entity/event matching, reconciliation history, freshness evaluation, revalidation and canonical sports graph storage. This is tracked by GitHub issue #27.

The Content Core still needs production persistence, editorial workflow integration, correction history and observability around the existing fact firewall primitives. This is tracked by GitHub issue #14.

The trend/location/monetization layer still needs production implementation with coarse location by default, explicit precise-location opt-in, provenance and ad/editorial separation. This is tracked by GitHub issue #13.

These are implementation backlogs, not permissions to bypass the Ship Gate.
