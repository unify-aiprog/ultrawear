# Continuous ingestion

UltraWear treats provider data as observations that must remain fresh and revalidated.

## Health states

- `healthy`: recent observation inside the event-status freshness window.
- `degraded`: an observation or check is older than its target window, or a source has a recent failure.
- `stale`: freshness has exceeded twice the target window.
- `offline`: three or more consecutive source failures.

## Adaptive polling

Live events poll more aggressively than scheduled events. Degraded and stale sources back off to avoid wasting requests while still remaining eligible for revalidation. Offline sources back off further and can be recovered by the next successful poll.

The policy is deterministic and provider-neutral. Source adapters remain replaceable and commercial providers are not required by the scheduler.

## Freshness defaults

- live: 30 seconds
- halftime: 60 seconds
- scheduled: 15 minutes
- finished/postponed/cancelled: 60 minutes

These are policy defaults, not claims about any provider's guaranteed latency. Individual adapters can supply tighter operational policies when their documented limits allow it.
