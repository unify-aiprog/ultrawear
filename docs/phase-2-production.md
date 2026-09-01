# Phase 2 — Content Production Core

The production layer converts a ranked opportunity into a reviewable story while preserving evidence and preventing unsupported claims from becoming publishable.

## Flow

`opportunity → research pack → claims → evidence check → draft → editorial review → approval → publishing adapter`

## Hard rules

- AI is assistive, never the source of truth.
- Every factual claim must point to evidence.
- Weak or conflicting evidence blocks publication eligibility.
- Opinion must be explicitly labeled.
- Sponsored content must remain clearly separated from editorial content.
- Nothing auto-publishes from the Content Core.
- Revisions and corrections must remain auditable.

## Current implementation

`content-core/content-production.js` provides dependency-free primitives for research packs, claims, evidence verification, drafts and the publishability gate.

## Next implementation slices

1. Canonical story repository and idempotent revisions.
2. Provider-neutral model adapter for AI drafting.
3. Claim extraction and evidence attachment.
4. Editorial review queue with approve/reject/request-changes actions.
5. Correction and revision history.
6. Publishing adapter contract.
7. Integration tests across the complete opportunity-to-approval path.
