# Implementation Plan: UltraWear Content Core Engine

## Existing foundation discovered during repository reconnaissance

The repository already contains a dependency-free JavaScript Content Core under `content-core/`, including `contracts.js`, `pipeline.js`, `fact-firewall.js`, `queue.js`, `publisher.js`, `revisions.js`, `intelligence.js`, `content-production.js`, `ai-provider.js`, tests, and a README. The existing implementation and tests must be characterized before extending or replacing any module. Do not create a parallel `lib/content` implementation.

The current `supabase/schema.sql` already defines a basic `articles` table (`slug`, `title`, `excerpt`, `body`, `category`, `author_name`, image, publication/update timestamps, and draft/published status). The schema also contains canonical sports catalogue/event tables. The first implementation increment must reconcile the existing `articles` contract and the Content Core's in-memory contracts with the actual SQL schema, auth model, and RLS before any new migration. The `supabase/` directory currently exposes SQL schema files rather than a conventional timestamped migrations directory; deployment/migration ownership must be confirmed.

The platform also has a `publishing/` module with article contracts, discovery, entities, sitemap, and tests. Reuse or consolidate these boundaries instead of duplicating publishing functionality.

## Architecture decisions

1. Keep the content domain inside the existing UltraWear application and data layer; do not create a second CMS service in the first release.
2. Define typed domain contracts and lifecycle transition functions before adding UI or model calls.
3. Persist canonical stories, source evidence, claim checks, revisions, editorial decisions, and distribution jobs in Supabase using migrations and server-side authorization.
4. Consume Sports Brain and Trend Intelligence through internal typed adapters/events. The content domain must not import vendor SDKs.
5. Keep model calls behind a provider interface. Treat all generated output as untrusted and store model/action metadata.
6. Use durable, idempotent jobs with bounded retries. Confirm the queue primitive against the current Cloudflare deployment before implementation.
7. Expose editorial actions through authenticated server routes/actions with role checks and audit records.
8. Render derivatives from canonical story data; only the canonical story owns the canonical URL.
9. Instrument with the existing Sentry integration; introduce PostHog only after privacy and event-taxonomy review.

## Proposed domain modules

- `content/contracts`: Story, StoryVersion, StoryClaim, Evidence, ResearchPack, EditorialDecision, DistributionJob.
- `content/lifecycle`: allowed transitions and server-side guards.
- `content/provenance`: evidence normalization, freshness, source trust, claim/evidence linkage.
- `content/opportunities`: signal-to-opportunity mapping and explainable prioritization.
- `content/research`: research pack assembly from verified internal and external source adapters.
- `content/drafting`: model provider interface, prompt/version metadata, structured draft validation.
- `content/editorial`: role-checked decisions, scheduling, publish, correction, withdrawal.
- `content/distribution`: idempotent derivative jobs and canonical URL references.
- `content/discovery`: entity/topic links, related stories, freshness and duplicate detection.
- `content/seo`: metadata and structured data generation.
- `content/analytics`: privacy-conscious domain event definitions.

## Data model proposal

Confirm existing schema before migrations. The existing `articles` table is the starting point for compatibility analysis, not a reason to create a second article table. Likely entities to add only when justified:
- `content_stories` — canonical identity, locale, sport, type, lifecycle, slug, timestamps.
- `content_story_versions` — immutable content revisions and author/model metadata.
- `content_sources` — source registry, terms/allowance metadata, trust and freshness policy.
- `content_evidence` — source observations and provenance.
- `content_claims` — factual claims and verification state, linked to evidence.
- `content_editorial_decisions` — reviewer, decision, reason, timestamp.
- `content_jobs` — idempotency key, status, attempts, next retry, error summary.
- `content_derivatives` — channel, payload reference, canonical story, publish state.
- `content_entity_links` / `content_topic_links` — normalized discovery relations.

Do not create tables until existing migrations, RLS policies, and identity roles have been audited.

## Security and reliability

- RLS and server authorization for editorial data; never trust client-supplied role claims.
- Service-role credentials stay server-side.
- Validate and size-limit external payloads; sanitize rendered content.
- Use idempotency keys and transactional state changes where possible.
- Retry transient failures only; dead-letter permanent failures with actionable observability.
- Rate-limit expensive model and ingestion operations.
- No secret, prompt, or sensitive source data in logs.
- Test unauthorized editorial writes, duplicate events, stale evidence, model schema failures, and partial distribution failures.

## Delivery increments

### Increment 0 — Reconnaissance
Audit existing Supabase migrations, RLS, auth roles, route conventions, ingestion contracts, admin UI, and Cloudflare queue/runtime support. Produce a schema map and decision record.

### Increment 1 — Domain foundation
Add typed contracts, lifecycle state machine, provenance model, validation helpers, and unit tests. No AI integration yet.

### Increment 2 — Persistence and authorization
Add reviewed migrations, RLS policies, server repositories, audit events, and integration tests.

### Increment 3 — Editorial workflow
Add opportunity/research views, draft editor, evidence/claim review, and role-authorized approval/rejection/correction flows.

### Increment 4 — Jobs and distribution
Add durable idempotent job processing, retry/dead-letter behavior, canonical derivatives, and operational metrics.

### Increment 5 — AI assistance
Add provider adapter, structured outputs, evidence-grounded drafting, prompt/model versioning, human review, and adversarial tests.

### Increment 6 — Discovery, SEO, analytics
Add explainable trend/topic/entity signals, freshness and duplicate detection, canonical metadata, structured data, and privacy-conscious analytics.

## Release gates

- Web Constitution Ship Gate and CI pass.
- Migrations tested against a disposable database and RLS verified.
- Playwright covers editorial happy path, unauthorized action, correction, and canonical distribution.
- Accessibility checks pass for editorial queue and editor.
- Observability and rollback plan documented.
- No AI auto-publish path exists.
