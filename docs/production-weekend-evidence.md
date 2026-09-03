# Production weekend evidence + final launch gate

## Purpose

Record the final production evidence for the September 5–6, 2026 weekend readiness run and the September 15, 2026 launch decision.

This document separates **repo-verifiable evidence** from **production-only evidence**. A green CI run is necessary, but it is not a substitute for observing the deployed application and scheduled ingestion in production.

## Evidence window

- Weekend readiness: September 5–6, 2026
- Final launch target: September 15, 2026
- Weekend action window used by `/api/health/sports-action`: Saturday 00:00 UTC through Monday 00:00 UTC

## Production evidence checklist

| Gate | Evidence to capture | Required result | Status |
| --- | --- | --- | --- |
| Production health | `/api/health` after final deployment | `healthy`; persistent `degraded`/`down` blocks launch | PENDING |
| Weekend sports readiness | `/api/health/sports-action` during the weekend | No canonical-status or identity violations; missing coverage is explicit | PENDING |
| Catalogue ingestion | Latest catalogue workflow run | Successful cycle | PENDING |
| Standings ingestion | Latest standings workflow run | Successful cycle | PENDING |
| Live ingestion | Live workflow runs during active fixtures | Successful cycles and bounded failures | PENDING |
| Scheduled → live → finished | Same event observed across lifecycle | Canonical status transitions and identity remain stable | PENDING |
| Provider degradation | Controlled timeout / rate-limit evidence | Retry/backoff; bounded failure; no page-wide failure | PENDING |
| Cache degradation | Redis unavailable or failing | Reads fall back without breaking rendering | PENDING |
| User funnel | Home → sport → event → live | Routes render and links remain usable | PENDING |
| Mobile smoke | Launch routes on mobile viewport | Navigation/layout usable; no blocking overflow | PENDING |
| SEO | Sitemap, robots, canonical, OG, structured data | Valid and consistent with production origin | PENDING |

## Weekend evidence notes

The weekend is materially active across sports: the September 5–6 calendar includes Premier League football and the US Open tennis, while the FIBA Women's Basketball World Cup is underway from September 4–13. This makes the weekend suitable for exercising multi-sport coverage and live-state behavior.

Do not convert external fixture calendars into product coverage claims. Product coverage must be established from the deployed UltraWear data and health endpoints.

## Evidence record

For each production observation, record:

- UTC timestamp
- deployment/version identifier
- endpoint or workflow checked
- observed result
- latency where available
- relevant event/provider identifier
- screenshot or log reference when available
- whether the result is a blocker, warning, or pass

## Final go/no-go rule

**GO** only when:

1. CI is green on the final `main` deployment.
2. `/api/health` is observed `healthy` after that deployment.
3. Each enabled scheduled ingestion workflow has completed at least one successful production cycle.
4. Weekend sports readiness shows no canonical identity/status violations.
5. Live lifecycle checks show stable event identity and canonical status transitions.
6. Provider and Redis degradation paths remain bounded and non-fatal.
7. Homepage, sport, event, and live routes pass desktop/mobile smoke checks.
8. Production sitemap, robots, canonical URLs, and structured data resolve correctly.

Any unmet item remains **NO-GO / PENDING** until evidence is captured and reviewed.

## Current decision

**PENDING — production evidence has not been claimed by this repository change.**

The repository can prove implementation and CI behavior. Production health, scheduled-job execution, real provider degradation, cache failure behavior, and mobile/SEO observations must be captured against the deployed environment before the September 15 launch is marked green.
