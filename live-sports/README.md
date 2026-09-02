# Live Sports + Community

Provider-neutral contracts for the Phase 4 live layer.

Pipeline: sports source -> normalized event -> live event page -> community interaction -> follow -> alert candidate.

Rules:
- source adapters own provider-specific payloads;
- live state is refreshed from trusted source timestamps;
- community interactions are non-gambling participation primitives;
- alert candidates are not delivery or notification side effects;
- location ranking uses coarse layers by default;
- no production function auto-publishes or sends alerts.
