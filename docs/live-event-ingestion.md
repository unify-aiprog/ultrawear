# Live event ingestion

UltraWear event pages use a provider-neutral pipeline:

`provider -> server-side normalization -> canonical event -> EVENT_STORE + EVENT_INDEX -> event API -> /event/<id>`

## Sportradar Soccer v4

UltraWear now has a server-side Sportradar client for:

- **Daily Summaries** — `/api/sports/soccer/daily`
- **Live Summaries** — `/api/sports/soccer/live`
- **Competitor Summaries** — `/api/teams/{competitorId}/sportradar-summary`

Sportradar documents Competitor Summaries as providing upcoming scheduling information and the 30 most recent completed matches for a competitor, with a 300-second cache/TTL. Daily Summaries provide a day's soccer fixtures/results, while Live Summaries provide currently live matches and update much more frequently. The website keeps these provider calls server-side.

## Runtime contract

The existing `createIngestionRunner` accepts a `registry`, a provider `fetchSource`, and an optional `eventStore`. When a normalized event changes, the runner persists it. The browser never receives provider credentials or calls a sports provider directly.

## Cloudflare bindings

Configure these KV namespaces in the deployment environment:

- `EVENT_STORE`: canonical event JSON, keyed by event id.
- `EVENT_INDEX`: compact list used by `/api/events` for homepage discovery.
- `TEAM_HISTORY`: persistent team match history.
- `PLAYER_HISTORY`: persistent player event/performance history.
- `PLAYER_STORE`: persistent player records.
- `PERSON_STORE`: persistent person identities.
- `TRENDING_STORE`: aggregated community-interest signals.

Also configure the server secret:

- `SPORTRADAR_API_KEY`
- optional `SPORTRADAR_ACCESS_LEVEL` (`trial` by default)
- optional `SPORTRADAR_LANGUAGE` (`en` by default)

Do not commit production namespace IDs or provider credentials to the repository.

## Provider endpoints

The server-side client uses the documented Soccer v4 URL structure and `x-api-key` authentication. The browser only calls UltraWear's own `/api/sports/soccer/*` endpoints.

The homepage first requests the live feed, then today's daily summaries when no live matches are returned. It refreshes the verified feed every 10 seconds. If the provider is not configured or unavailable, the UI falls back to explicitly labelled demo data rather than presenting fabricated scores as live.

## Publishing

When the daily/live endpoint receives valid provider data and `EVENT_STORE` + `EVENT_INDEX` are configured, normalized canonical events are published to both stores. This means the same event can appear on the homepage and its permanent `/event/<id>` page.

## Event lifecycle

A single event URL survives the full lifecycle:

`scheduled -> live -> halftime -> finished`

with `postponed` and `cancelled` as terminal alternatives. The event page polls every 10 seconds while active and stops once the event is historical.
