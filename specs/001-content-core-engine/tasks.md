# Task Breakdown: UltraWear Content Core Engine

Tasks are ordered for small reviewable pull requests. Do not skip reconnaissance or create speculative schema.

## 0. Reconnaissance
- [ ] Map existing Supabase migrations and identify content/editorial tables.
- [ ] Map auth roles, RLS policies, and server-side authorization helpers.
- [ ] Trace Sports Brain and Trend Intelligence event/data contracts.
- [ ] Identify current admin/editorial routes and reusable UI.
- [ ] Verify Cloudflare Workers-compatible durable queue option.
- [ ] Record architecture decisions and migration plan.

## 1. Domain foundation
- [ ] Define canonical Story, StoryVersion, Claim, Evidence, ResearchPack, EditorialDecision, and DistributionJob types.
- [ ] Implement lifecycle transition map and invalid-transition errors.
- [ ] Implement claim/evidence linkage and freshness checks.
- [ ] Implement structured input validation and sanitization boundaries.
- [ ] Add fixtures for routine, breaking, ambiguous, conflicting, stale, opinion, sponsored, and correction cases.
- [ ] Add unit tests for lifecycle, provenance, and claim firewall.

## 2. Persistence and authorization
- [ ] Design migrations only after schema reconnaissance.
- [ ] Add RLS policies for editorial roles and public published content.
- [ ] Add server-only repository functions.
- [ ] Add audit records for every editorial state change.
- [ ] Test anonymous, member, editor, and administrator access boundaries.
- [ ] Test idempotent ingestion and transaction rollback behavior.

## 3. Editorial workflow
- [ ] Build prioritized opportunity queue with explainable scoring.
- [ ] Build research pack detail view with source timestamps and conflicts.
- [ ] Build draft editor with clear AI-draft labeling.
- [ ] Build claim/evidence review panel.
- [ ] Implement request-changes, approve, reject, schedule, publish, correct, and withdraw actions.
- [ ] Add browser tests for editorial workflow and authorization failures.

## 4. Jobs and distribution
- [ ] Define typed job envelopes and deterministic idempotency keys.
- [ ] Implement bounded retries, backoff, and terminal failure handling.
- [ ] Implement canonical story-to-derivative references.
- [ ] Add partial-failure recovery for individual channels.
- [ ] Add queue metrics, correlation IDs, and Sentry reporting.
- [ ] Test duplicate signals, retry replay, and derivative failures.

## 5. AI assistance
- [ ] Define provider-neutral model adapter contract.
- [ ] Validate model structured outputs and reject malformed results.
- [ ] Generate drafts only from supplied evidence and approved editorial context.
- [ ] Persist model/provider/version/action metadata.
- [ ] Add prompt-injection and unsupported-claim test cases.
- [ ] Ensure no model output can directly publish content.

## 6. Discovery and distribution intelligence
- [ ] Add topic clustering and entity-link adapters.
- [ ] Add trend-to-opportunity mapping with explainable factors.
- [ ] Add freshness/decay and duplicate/cannibalization checks.
- [ ] Generate canonical metadata and appropriate structured data.
- [ ] Add related-content and internal-link recommendations.
- [ ] Define privacy-conscious analytics events and consent requirements.

## 7. Release
- [ ] Run Web Constitution Ship Gate, typecheck, lint, build, and unit/integration tests.
- [ ] Run Playwright editorial journeys and accessibility checks.
- [ ] Review RLS, authorization, source terms, retention, and secret handling.
- [ ] Document deployment, rollback, monitoring, and editorial operating procedures.
