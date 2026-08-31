# UltraWear FC Sports Platform — Implementation Contract

## Goal

Build UltraWear FC as a fan-first, multi-sport platform with an autonomous sports data, newsroom, discovery, distribution and monetization layer. `FC` means **For Community**. The fashion/product arm is out of scope for this phase.

## Phase 1 — Platform Foundation

Implement the smallest production-ready foundation that future autonomous systems can build on:

- Next.js web application shell and responsive design system.
- Supabase/Postgres data layer with typed domain models.
- Provider-neutral sports data interfaces.
- Event-driven ingestion architecture.
- Content and source provenance models.
- Canonical entity IDs for sports, competitions, teams, players and matches.
- Health/status surfaces for data freshness and worker failures.

## Domain model

Core entities:

- Sport
- Competition
- Season
- Team
- Player
- Venue
- Match
- MatchEvent
- Standing
- Statistic
- Source
- ContentItem
- MediaAsset
- User
- Follow
- Notification

Every externally sourced fact must retain provider/source metadata, source timestamp, ingestion timestamp, verification state and confidence where applicable.

## Provider abstraction

Never couple UI or business logic directly to a single sports provider. Define interfaces/adapters so providers can be replaced or combined later.

The first implementation should support fixtures, results, live match state, teams, players, competitions and standings where available.

## Event architecture

Use typed domain events such as:

- MATCH_SCHEDULED
- MATCH_STARTED
- MATCH_EVENT_CREATED
- HALF_TIME
- FULL_TIME
- MATCH_UPDATED
- STANDING_UPDATED
- PLAYER_UPDATED
- TEAM_UPDATED
- NEWS_CANDIDATE_DETECTED

The event model must support future workers for content generation, notifications, social distribution and analytics without coupling them to the web request lifecycle.

## Autonomous newsroom contract

The future pipeline is:

`discover → verify → classify → prioritize → generate → fact-check → SEO/AEO/GEO → publish → distribute → measure`.

Do not implement competitor-article rewriting or article spinning. AI content must be grounded in verified sports data and legitimate source material. Unsupported claims must not publish automatically.

## Fan-first product contract

Initial navigation should support:

- Home
- Live
- Scores
- News
- Sports
- Explore
- Me

The architecture must support follows for teams, players, sports and competitions; personalized feeds; match centres; predictions; polls; notifications; search; and community features.

## SEO/AEO/GEO contract

Build metadata and structured-data primitives now so future entity and programmatic pages can automatically emit:

- canonical URLs
- title/meta description
- Open Graph metadata
- breadcrumbs
- appropriate Schema.org/JSON-LD
- published/updated timestamps
- source attribution
- internal entity links

Do not mass-generate thin pages. Programmatic pages must represent real, useful entities or events.

## Media contract

Media assets must retain creator, source, license/usage-rights and attribution metadata. Do not scrape or hot-link competitor imagery. The UI should support visible credits where required.

## Monetization contract

Keep monetization provider-neutral. Future adapters should support advertising, sponsorship, affiliate and premium products without contaminating core sports/content logic. Monetization must not create deceptive UX or interfere with core fan experiences.

## Non-functional requirements

- Type-safe boundaries.
- Testable domain logic.
- Idempotent ingestion/event handling.
- Retry-safe background work.
- Explicit stale-data states.
- No fabricated sports facts when providers fail.
- Secure server-side API credentials.
- Accessible responsive UI.
- Fast page loads and optimized media.
- Observability hooks for data freshness, queue failures and publishing failures.

## Definition of done for Phase 1

A developer can add a new sports-data provider without rewriting the application; a match can be ingested and updated through typed events; canonical sports entities can be persisted and queried; the web shell can render those entities; and later content, SEO, fan and monetization workers can subscribe to the same domain events.
