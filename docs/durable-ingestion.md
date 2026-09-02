# Durable ingestion execution

`live-sports/durable-ingestion.js` separates continuous ingestion from process-local timers. A durable scheduler owns the next execution time and source context; an execution platform is responsible for invoking `runDue()`.

## Execution contract

1. A source is scheduled with an event status and optional polling bounds.
2. An execution trigger asks the scheduler for due sources.
3. The coordinator ingests each due source.
4. `nextPollDelay()` determines the next interval from event status and source health.
5. The source is scheduled again, including the last run time and error state when applicable.

The coordinator accepts an optional scheduler `claim()` operation. This is intentionally an adapter-level capability: a plain KV `list` followed by `put` is not an atomic distributed lock. Deployments that require strict single-consumer execution should provide an atomic claim primitive through a queue, Durable Object, database transaction, or equivalent platform mechanism.

The existing `createContinuousIngestionScheduler()` remains a process-local timer implementation for local development and deterministic tests. It is not the durable production execution contract.
