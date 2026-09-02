# Ingestion health policy

Operational source health is separate from sports-fact verification.

Freshness and failure signals classify each source as healthy, degraded, stale, or offline. Poll cadence adapts to event state and source health so live events receive attention while unhealthy sources back off.
