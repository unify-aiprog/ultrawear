# Weekend Sports Readiness Run

## Purpose
Use the September 5–6, 2026 weekend as a real-world readiness test before the September 15 launch.

## Coverage
The readiness check covers the current launch sports: football, basketball, tennis, and running. Missing event coverage is reported separately from data-contract violations so an empty sport is visible without being misrepresented as valid coverage.

## Weekend window
The check uses Saturday 00:00 UTC through Monday 00:00 UTC for the next Saturday relative to the request time.

## Gates

- **Coverage:** each enabled sport is either represented by weekend events or explicitly reported in `missingSports`.
- **Canonical compliance:** event statuses use the canonical vocabulary; provider identity, competition sport identity, and both team relationships are present.
- **Performance:** the readiness endpoint records the database query duration as `queryMs`.
- **Reliability:** provider retries, rate-limit handling, malformed-data safety, and ingestion idempotency remain governed by the existing reliability layer.
- **Live behaviour:** scheduled events should transition through live states and finish without breaking the canonical event identity.
- **Graceful degradation:** missing optional data must produce an honest empty/degraded state rather than fabricated coverage.
- **Audience funnel:** homepage → sport → event/Match Centre → live remains internally connected through the same event graph.
- **SEO:** weekend surfaces remain server-rendered, crawlable, canonically addressed, and internally linked.

## Evidence to capture

1. `/api/health` after deployment.
2. `/api/health/sports-action` during the weekend.
3. At least one successful catalogue, standings, and live ingestion cycle.
4. Query/page timing and cache fallback behaviour.
5. Representative Match Centre checks across available sports.
6. Mobile and internal-link smoke tests.

A launch gate is green only when production health is healthy and enabled scheduled ingestion cycles have succeeded after the final deployment.