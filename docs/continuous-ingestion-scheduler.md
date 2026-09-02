# Continuous ingestion scheduler

The scheduler chooses the next polling interval from canonical event status and source health. Live events poll faster; degraded, stale, and offline sources back off. The scheduler is provider-neutral and safe to stop.