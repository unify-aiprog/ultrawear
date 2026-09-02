# Phase 2 acceptance gates

Phase 2 is complete only when an opportunity can safely travel through production without bypassing editorial control.

## Required flow

`opportunity -> research -> claims -> evidence -> draft -> verification -> editor approval -> publish contract`

## Hard gates

- Every factual claim has explicit evidence references.
- Evidence below the confidence threshold cannot silently support publication.
- Conflicting or unresolved claims remain in review.
- AI output must identify the claims it relies on.
- AI is an adapter, not a source of truth.
- Only the current revision can be approved.
- Only an approved current revision can be published.
- Corrections create an auditable revision record.
- Publishing produces a canonical article document.
- No production function auto-publishes content.

## Test command

Run the dependency-free phase suite with:

`node content-core/phase2.test.js`

## Exit condition

An editor can inspect the research/evidence trail, approve a specific revision, and hand a canonical article document to a future publishing adapter.
