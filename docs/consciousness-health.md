# Consciousness health signals

The `/api/health` endpoint is the system's operational awareness surface. It reports configuration, database reachability, cache state, and data freshness so scheduled jobs and deployment checks can distinguish healthy, degraded, and unavailable states.

## Freshness thresholds

- Catalogue/event freshness: 15 minutes.
- Live-event freshness: 10 minutes.
- A missing timestamp is treated as stale.

These thresholds are intentionally conservative for launch and should be tuned after observing real ingestion cadence.
