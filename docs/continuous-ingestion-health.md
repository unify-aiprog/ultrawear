# Continuous ingestion health

The ingestion engine now has a provider-neutral health model. Every source can be classified as `healthy`, `degraded`, `stale`, or `offline` from deterministic freshness and failure signals.

Live and halftime events receive shorter polling intervals; scheduled and terminal events back off. Degraded, stale, and offline sources back off further so request pressure does not increase when a provider is unhealthy.

Health is operational metadata, not proof that the underlying sports fact is correct. Fact verification remains the responsibility of the knowledge ledger and cross-source reconciliation layers.
