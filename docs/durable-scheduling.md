# Durable ingestion scheduling

Continuous polling must not depend on process-local timers. `live-sports/durable-scheduler.js` stores the next polling time and source context behind a small provider-neutral `put/list/delete` contract.

The scheduler is intentionally execution-agnostic:

1. ingestion decides the next delay from event/source health;
2. durable state records the next due time;
3. a platform scheduler (Cron, Queue consumer, Durable Object alarm, or another worker) asks for due items;
4. the execution layer ingests each source and reschedules it.

This keeps the data engine independent of Cloudflare-specific scheduling APIs while allowing Cloudflare to be the first deployment adapter.

Malformed or missing schedule timestamps are not treated as due. Scheduling is idempotent per source: writing a new schedule replaces the previous schedule for that source.
