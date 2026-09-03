# UltraWear FC Launch Sprint — Execution Rules

Go-live target: 2026-09-15.

## Build strategy

Implement by coherent vertical slices rather than one checklist item at a time. When foundational work closes multiple in-scope tasks safely, close them in the same build pass.

### Priority order

1. Foundation and deployment
2. Sport-agnostic data model
3. Worldwide free-tier football ingestion
4. Reusable competition/team/player/event templates
5. Editorial and policy content
6. SEO, analytics and indexing
7. Performance and launch QA

## Reuse rules

- Pages consume a provider-agnostic server data layer.
- Competition coverage is configuration-driven; never hard-code one competition per page implementation.
- Shared templates generate teams, people, competitions, events and articles.
- Redis is a cache layer; browser requests never call football-data.org directly.
- Ad slots are reusable reserved components and remain empty until approval/configuration.
- Motion is tokenized now, but launch only uses lightweight hover, focus, press, loading and content-entry feedback.

## Scope guardrail

Do not build live scores, personalization, community features, predictions, full Shopify integration, push notifications, or cinematic/game UX during this sprint. Early completion goes to hardening the in-scope surface.

## Definition of done

A feature is closed only when its route/template, real data path, responsive behavior, metadata/structured data where required, empty state and navigation integration are working. A placeholder that creates a future 404 is not considered complete.
