# Sports Core

Provider-neutral contracts for UltraWear FC's multi-sport platform.

## Rules

1. UI and content workers consume canonical domain data, never raw provider responses.
2. Every external object must be mapped to a stable internal entity ID.
3. Provider-specific IDs are retained only for synchronization/provenance.
4. Domain events must be idempotently consumable by downstream workers.
5. Missing or stale provider data must be represented explicitly; never fabricate a live state.
6. Adding a new sport should extend adapters and mappings, not fork the application architecture.

## Initial scope

Football is the first launch sport, but all interfaces remain multi-sport so basketball, tennis, boxing/MMA, cricket, esports and additional sports can be added without a rewrite.
