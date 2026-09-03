# Launch hardening

## Scope

Final pre-launch verification for the September 15, 2026 target.

## Checks

- Production TypeScript check and Next.js build pass in CI.
- `/api/health` reports `healthy`, with degraded/down states treated as launch blockers when persistent.
- Scheduled catalogue, standings, and live ingestion workflows run successfully.
- Provider failures remain bounded and retry-aware.
- Redis/cache failures degrade transparently to Supabase.
- Canonical catalogue IDs, slugs, event statuses, dates, and relationships remain consistent across catalogue, live, standings, fixtures, and match pages.
- Sitemap, robots, canonical URLs, Open Graph metadata, and structured data are valid.
- Mobile layouts and primary navigation remain usable across launch routes.
- No production page depends on a single optional provider/cache service for rendering.

## Launch gate

Do not treat the launch as green until CI and the production health endpoint have both been observed healthy after the final deployment, and scheduled ingestion has completed at least one successful cycle for each enabled workflow.
