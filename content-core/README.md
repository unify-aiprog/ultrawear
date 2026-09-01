# UltraWear Content Core Engine

The Content Core is the editorial brain of UltraWear. It converts trusted signals into useful, attributable content and coordinated distribution while keeping humans in control of publishing.

## Pipeline

`signal → enrichment → opportunity → research → draft → verify → review → publish → distribute → measure → refresh`

## Principles

- **Truth first:** every factual claim should be traceable to source evidence.
- **Human-gated:** AI may assist research, drafting, packaging and distribution; ambiguous or sensitive stories require editorial review.
- **One canonical story:** derivatives should reference the canonical story rather than create duplicate SEO pages.
- **Provider-neutral:** data, AI and distribution providers are adapters, not the core model.
- **Freshness-aware:** published stories can become stale and should have explicit refresh/review states.
- **Community-minded:** useful audience participation is part of the lifecycle, not an afterthought.

## Initial domain model

See `contracts.js` for the first provider-neutral contracts and `pipeline.js` for the deterministic lifecycle/state transitions. These are intentionally dependency-free so they can become the stable boundary for future adapters, workers, APIs and storage.
