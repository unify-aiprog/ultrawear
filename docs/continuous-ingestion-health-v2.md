# Continuous ingestion health

UltraWear treats provider data as observations that must remain fresh and revalidated.

Health states are `healthy`, `degraded`, `stale`, and `offline`. Freshness defaults vary by event status: live 30 seconds, halftime 60 seconds, scheduled 15 minutes, and terminal states 60 minutes.

Adaptive polling is deterministic and provider-neutral. Live events poll more aggressively; unhealthy sources back off. Health is operational metadata and never substitutes for fact verification, which remains the responsibility of the knowledge ledger and cross-source reconciliation.
