# UltraWear FC launch checklist

Target launch: 15 September 2026.

## Required production configuration

- `NEXT_PUBLIC_SITE_URL` — production canonical origin, including `https://`.
- `NEXT_PUBLIC_SUPABASE_URL` — production Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase public key.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only Supabase key; never expose it to the browser.
- `FOOTBALL_DATA_API_TOKEN` — football-data.org API token.
- `FOOTBALL_DATA_INGEST_SECRET` — long random secret for ingestion endpoints.
- `FOOTBALL_DATA_STANDINGS_CODES` — competitions to refresh for standings.
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` — optional until GA4 is ready.
- Upstash variables are optional; without them the application falls back to database/provider reads.

## GitHub Actions secrets

Set these repository secrets:

- `ULTRAWEAR_INGEST_URL` = `https://<production-host>/api/ingest/football`
- `ULTRAWEAR_STANDINGS_URL` = `https://<production-host>/api/ingest/football/standings`
- `ULTRAWEAR_LIVE_SYNC_URL` = `https://<production-host>/api/ingest/football/live`
- `ULTRAWEAR_INGEST_SECRET` = same value as `FOOTBALL_DATA_INGEST_SECRET`
- `ULTRAWEAR_STANDINGS_URL` is used by the standings workflow; keep it pointed at the production endpoint.

## Supabase

1. Apply `supabase/catalogue-schema-v2.sql` to the production project.
2. Confirm the seeded sports exist.
3. Run catalogue ingestion manually once.
4. Run standings ingestion manually once.
5. Run live ingestion manually once.
6. Check `/api/health` returns HTTP 200.

## SEO / analytics

- Verify canonical URLs use the production site URL.
- Verify `/robots.txt` points at `/sitemap.xml`.
- Verify `/sitemap.xml` contains competition, team and article routes after catalogue data is loaded.
- Register the production property in Google Search Console and submit the sitemap.
- Add the GA4 measurement ID and verify a production page view.
- Keep ad slots reserved until the publisher/ad approval process is complete.

## Pre-launch QA

- Test homepage, sports, catalogue, teams, competitions, fixtures, live, news, article, match and player routes on mobile and desktop.
- Test a missing route and confirm the 404 state.
- Test a forced page error and confirm retry recovery.
- Verify ingestion endpoints return 401 without the secret.
- Verify no service-role or provider secrets are rendered into client bundles.
- Confirm live pages refresh and stale live events are retired.
- Confirm standings and catalogue sync workflows have successful runs.
- Run `npm run check` and `npm run build` in CI before merging.

## Launch gate

Do not call the site production-ready until CI is green, production environment variables are configured, Supabase is migrated, the first catalogue/standings/live syncs succeed, and `/api/health` returns 200.
