# UltraWear FC production validation

This runbook closes the gap between a repository that is structurally ready and a production environment that has actually been exercised.

## Required production configuration

Set these in the deployment environment:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `FOOTBALL_DATA_API_TOKEN`
- `SPORTS_REVALIDATION_CRON_SECRET`

Optional cache/provider integrations must remain optional and must not be required for the public site to render.

## Apply the database schema

Apply both SQL files to the target Supabase project, in this order:

1. `supabase/catalogue-schema-v2.sql`
2. `supabase/constitutional-platform.sql`

Then verify that the following tables exist and are queryable by the server role:

- `sports`
- `countries`
- `competitions_v2`
- `seasons`
- `teams_v2`
- `team_competitions`
- `events_v2`
- `competition_standings`
- `sports_source_observations`
- `sports_reconciliation_runs`
- `content_stories`
- `content_audit_log`
- `content_claims`
- `trend_signals`
- `editorial_opportunities`

Confirm the editorial and community security-definer RPCs are executable by `service_role` and not by `anon` or `authenticated`.

## Exercise the production service

1. `GET /api/health` must return HTTP 200 and `status: healthy` after the first successful sync cycle.
2. The sports revalidation endpoint must return HTTP 401 without its bearer secret.
3. The same endpoint must succeed with `Authorization: Bearer <SPORTS_REVALIDATION_CRON_SECRET>`.
4. Confirm at least one event observation and reconciliation run were persisted.
5. Confirm catalogue competitions, seasons, teams and standings are populated from the canonical tables.
6. Confirm the public `/sports`, `/catalogue`, `/fixtures`, `/live` and `/news` routes render without requiring the provider directly from the browser.

## Provider expansion rule

Do not add a second sports provider by writing directly into canonical tables. Implement a provider adapter that emits provider-neutral observations, persist them through the trust layer, reconcile them, and only then materialize canonical records.

Additional sports should be added only when a real provider contract and credentials are available. Unsupported sports must remain explicitly unsupported rather than receiving fabricated data.

## Trends, analytics and advertising

Real integrations remain opt-in work. Before enabling one:

- document the provider and data purpose;
- collect only the consent purpose required by that integration;
- enforce the consent decision server-side before persistence or transmission;
- keep advertising/editorial labeling explicit;
- verify that disabling optional tracking does not break core sports, news or community functionality.

## Completion evidence

Record the date, deployment revision, schema revision, health response, first successful revalidation, and enabled provider list in the launch checklist. A repository commit alone is not evidence that production integrations have been exercised.
