# Live event ingestion

UltraWear event pages use a provider-neutral pipeline:

`provider -> server-side normalization -> canonical event -> EVENT_STORE + EVENT_INDEX -> event API -> /event/<id>`

## Runtime contract

The existing `createIngestionRunner` accepts a `registry`, a provider `fetchSource`, and an optional `eventStore`. When a normalized event changes, the runner persists it. The browser never receives provider credentials or calls a sports provider directly.

## Cloudflare bindings

Configure two KV namespaces in the deployment environment:

- `EVENT_STORE`: canonical event JSON, keyed by event id.
- `EVENT_INDEX`: compact list used by `/api/events` for homepage discovery.

Do not commit production namespace IDs or provider credentials to the repository. Configure the namespace IDs and the SportRadar API secret in the deployment platform.

## Provider worker

A scheduled/server-side worker should:

1. Fetch the provider's event/status/timeline payload.
2. Pass it to the registered SportRadar adapter.
3. Run `createIngestionRunner` with `createKvEventStore(env.EVENT_STORE)`.
4. Persist the changed event.
5. Update the event index with the canonical event summary.
6. Record source health and alert candidates.

The adapter currently maps only fields proven by the provider contract. Missing statistics must remain absent rather than being inferred or fabricated.

## Event lifecycle

A single event URL survives the full lifecycle:

`scheduled -> live -> halftime -> finished`

with `postponed` and `cancelled` as terminal alternatives. The event page polls every 10 seconds while active and stops once the event is historical.
