# UltraWear FC launch checklist

Target launch: 15 September 2026.

## Required production configuration

- `NEXT_PUBLIC_SITE_URL` — production canonical origin, including `https://`.
- `NEXT_PUBLIC_SUPABASE_URL` — production Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase public key.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only Supabase key; never expose it to the browser.
- `FOOTBALL_DATA_API_TOKEN` — football-data.org API token.
- `SPORTS_REVALIDATION_CRON_SECRET` — secret required by the production revalidation endpoint.
- `FOOTBALL_DATA_INGEST_SECRET` — retained only for explicitly supported standalone ingestion endpoints.
- `FOOTBALL_DATA_STANDINGS_CODES` — competitions to refresh for supported football ingestion.
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` — optional until GA4 is explicitly enabled behind the consent model.
- Upstash variables are optional; without them the application falls back to database/provider reads.

## GitHub Actions secrets

The scheduled sports workflow uses:

- `ULTRAWEAR_REVALIDATION_URL` = production origin used by the sports revalidation workflow.
- `SPORTS_REVALIDATION_CRON_SECRET` = same value configured in production.

Legacy standalone ingestion workflow secrets are no longer used by scheduled workflows.

## Supabase

1. Apply `supabase/catalogue-schema-v2.sql` to the production project.
2. Apply `supabase/constitutional-platform.sql` after the catalogue schema.
3. Confirm the seeded sports exist.
4. Confirm the constitutional tables, RLS policies and service-role-only RPC grants exist.
5. Run the sports revalidation workflow once.
6. Check `/api/health` returns HTTP 200 with `status: healthy`.

## Production validation workflow

Run the manual `.github/workflows/production-validation.yml` workflow after every production deployment. It verifies:

- the protected sports revalidation endpoint returns `401` without credentials;
- the same endpoint succeeds with the configured bearer secret;
- `/api/health` reports `healthy` after the successful revalidation.

The workflow requires `ULTRAWEAR_PRODUCTION_URL` and `SPORTS_REVALIDATION_CRON_SECRET` repository secrets.

## SEO / analytics

- Verify canonical URLs use the production site URL.
- Verify `/robots.txt` points at `/sitemap.xml`.
- Verify `/sitemap.xml` contains the supported sports, competition, team and article routes after data is loaded.
- Register the production property in Google Search Console and submit the sitemap.
- Only enable analytics after the applicable consent path is implemented and verified.
- Keep ad slots reserved until the publisher/ad approval process is complete and advertising is explicitly consent-aware where required.

## Pre-launch QA

- Test homepage, sports, teams, competitions, fixtures, live, news, article, match and player routes on mobile and desktop.
- Test a missing route and confirm the 404 state.
- Test a forced page error and confirm retry recovery.
- Verify protected mutation and revalidation endpoints return 401 without credentials.
- Verify no service-role or provider secrets are rendered into client bundles.
- Confirm live pages refresh and stale live events are retired.
- Confirm the sports revalidation workflow has a successful run.
- Confirm at least one sports observation and reconciliation run was persisted.
- Run `npm run constitution:check`, `npm test`, `npm run test:sports`, `npm run test:platform`, `npm run test:privacy`, `npm run check`, `npm run build` and `npm run test:browser` in CI before merging.

## Launch gate

Do not call the site production-ready until CI is green, production environment variables are configured, both Supabase schemas are migrated, the first sports revalidation cycle succeeds, the production validation workflow passes, and `/api/health` returns 200.
