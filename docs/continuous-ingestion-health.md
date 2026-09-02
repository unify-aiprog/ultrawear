# Continuous ingestion health

UltraWear uses deterministic source health separate from sports-fact verification.

- `healthy`: fresh observation inside the status-specific window.
- `degraded`: recent failure or observation beyond its target window.
- `stale`: observation/check older than twice the target window.
- `offline`: three consecutive failures.

Default freshness windows are 30 seconds for live, 60 seconds for halftime, 15 minutes for scheduled, and 60 minutes for terminal states. Adaptive polling is faster for live events and backs off unhealthy sources.
