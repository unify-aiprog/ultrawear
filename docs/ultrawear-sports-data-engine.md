# UltraWear Sports Data Engine

UltraWear is building a provider-neutral sports knowledge system rather than a provider-dependent score feed.

## Principles

1. **Providers are inputs, not the contract.** Open, self-hosted and commercial sources all normalize into the same canonical event model.
2. **Free-first.** Open sources are preferred by default. Commercial providers such as Sportradar are optional adapters.
3. **Provenance is data.** Every observation records its source, observation time and confidence.
4. **Conflicts are explicit.** Different sources are not silently merged when they disagree.
5. **Events become permanent knowledge.** A live event can update histories, player performance, team records, statistics, search, content and trend signals.
6. **Deterministic first.** Normalization, reconciliation and statistical calculations do not require an LLM.

## Current foundation

- `live-sports/source-catalog.js` defines source types, capabilities and priority.
- `live-sports/knowledge-ledger.js` stores provider-neutral observations and reconciles corroboration/conflict.
- `live-sports/data-engine.js` selects available sources and produces reconciled knowledge.
- `live-sports/events.js` remains the canonical event contract used by the existing ingestion pipeline.

## Initial source strategy

| Source | Role | Priority | Notes |
| --- | --- | ---: | --- |
| football-data.org | Open football foundation | 10 | Fixtures, results, standings and history |
| TheSportsDB | Broad multi-sport source | 20 | Useful for entity and event coverage |
| OpenLigaDB | Open football corroboration | 30 | Especially useful for live/fixture corroboration where covered |
| Sportradar | Optional commercial adapter | 100 | Never required for the product to function |

Coverage and usage rights must be verified for each deployment before production ingestion. The catalog describes architectural roles; it is not a blanket license to redistribute third-party data.

## Target loop

`collect -> normalize -> reconcile -> store -> index -> interpret -> publish -> observe community signals -> reverify -> correct`

The website should consume canonical UltraWear entities, not provider-specific payloads. This allows the data layer to evolve independently from the UI and prevents a single vendor from becoming a permanent dependency.
