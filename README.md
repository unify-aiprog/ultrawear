# UltraWear FC

**FC = For Community.**

UltraWear FC is a sports and lifestyle brand rooted in football culture, with a long-term vision beyond football. The digital product is being built as a living sports-and-culture experience rather than a conventional sports news site or storefront.

## Live participation engine

The first product loop is now implemented without requiring an external sports-data provider:

`SPORTS SIGNAL → VALIDATE → SCORE → EXPERIENCE → PARTICIPATE → PROGRESS → RETURN`

The repository contains a provider-neutral sports model, a deterministic local event simulator, an experience builder, a live API route, and a browser-side participation/progression layer. The simulator is deliberately replaceable: a future licensed sports feed can implement the same internal `SportsEvent` contract without changing the product experience.

### Current live surface

- `/api/live` exposes current validated demo sports experiences.
- The home page renders a **What's Happening** live-world surface beneath the existing brand experience.
- Live experiences refresh every 15 seconds and never pretend that unavailable data is real.
- Fans can participate through predictions, polls, reactions, and quests.
- Participation creates XP, levels, streak state, and badges locally in the browser for the zero-infrastructure prototype.
- Sports events preserve source and verification state in the domain model.

## Architecture

```text
lib/sports/types.ts          provider-neutral sports contract
lib/sports/validation.ts     trust boundary + event scoring
lib/sports/simulator.ts      zero-cost local event source
lib/participation/progress.ts participation + progression domain
app/api/live/route.ts        live experience API
components/live-experience.tsx interactive sports-world UI
app/live-world.css           responsive experience layer
```

## Zero-external-dependency rule

The live prototype does not require a paid sports API, hosted database, hosted auth provider, analytics vendor, AI API, or commerce platform to demonstrate the core UltraWear thesis. External providers can be connected later through adapters; they must not define the internal domain model.

The production system will still require legitimate rights/licensing for live sports data and media where applicable. This prototype intentionally uses simulated signals until those sources are available.

## Web Constitution

The web experience is governed by the [UltraWear FC Web Constitution](docs/WEB_CONSTITUTION.md). It defines standards for experience, design, content, sports data, trust, community, technology, accessibility, privacy, commerce, governance, and long-term evolution.

Before shipping significant work, use the constitution's **Ship Gate**: community, utility, trust, experience, accessibility, integrity, architecture, brand, future-readiness, and real-world functionality.

## Development approach

Work should be delivered in small, reviewable branches and merged through pull requests into `main`.

## Brand principle

UltraWear FC starts with football-inspired products and culture, but the brand is intentionally designed to grow into a broader sports and lifestyle platform.
