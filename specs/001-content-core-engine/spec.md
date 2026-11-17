# Feature Specification: UltraWear Content Core Engine

**Status:** Proposed, ready for architecture review  
**Source:** GitHub issue #14  
**Brand constraint:** UltraWear FC means For Community. Football is the launch wedge, not the product boundary.

## Problem

UltraWear needs an owned content operating system that converts verified sports signals, trends, entities, and editorial inputs into original, attributable content and coordinated distribution. It must not be a thin AI article generator or a competitor-content spinner.

## Product outcome

Editors can discover story opportunities, inspect a traceable research pack, create and revise drafts, verify claims against source evidence, approve publication, and distribute one canonical story into multiple surfaces without duplicate canonical pages.

## Users and journeys

### P1 — Editorial operator
- View a prioritized queue of story opportunities with source freshness and reason-for-score.
- Open a research pack showing source URLs, timestamps, extracted facts, confidence, and unresolved conflicts.
- Create a draft from verified inputs; all AI-suggested text is clearly marked as draft.
- Review claim-to-source evidence, edit, request changes, approve, schedule, or reject.
- See the full revision and correction history.

### P1 — Platform service
- Ingest idempotent signals from the canonical Sports Brain and Trend Intelligence interfaces.
- Resolve topic/entity references without making the content domain depend on one sports-data or AI vendor.
- Queue work with bounded retries and observable terminal failure states.
- Generate SEO metadata and channel-specific derivatives from one canonical story.
- Preserve provenance and lifecycle state across retries and updates.

### P2 — Audience member
- Discover current, useful, clearly labeled stories across sports and regions.
- Follow a canonical story/entity and receive relevant updates without duplicate pages.
- Distinguish reporting, analysis/opinion, sponsored content, and simulated/demo data.

## Functional requirements

1. **Canonical story identity:** Every story has a stable ID, canonical slug/URL, content type, locale, sport/entity references, and lifecycle state.
2. **Lifecycle:** `opportunity → research_ready → drafting → editorial_review → approved → scheduled/published → updated/withdrawn`; rejected and failed states must be explicit. State transitions are validated server-side.
3. **Provenance:** Every imported fact stores source identity/URL, observed-at time, retrieval time, source excerpt or structured value where permitted, and verification state. Never fabricate citations.
4. **Claim firewall:** Claims without adequate evidence are flagged; conflicting, stale, ambiguous, sensitive, or high-impact claims require human review. No AI auto-publish.
5. **AI boundary:** Models may classify, summarize supplied evidence, propose angles, draft, and repurpose approved material. Provider access is behind an adapter. Model output is untrusted input and is validated before persistence.
6. **Editorial review:** Role-authorized reviewers can approve, reject, request changes, schedule, publish, correct, and withdraw. Every action is auditable.
7. **Jobs:** Queue operations are idempotent, retryable with bounded backoff, deduplicated by operation key, and observable. A failed derivative must not corrupt the canonical story.
8. **Distribution:** Derivatives (homepage module, entity update, newsletter candidate, social copy, notification candidate, audio/short-form brief) point to the canonical story. No independent duplicate canonical URLs.
9. **Discovery intelligence:** Support topic clustering, entity linking, trend opportunities, search questions, content gaps, freshness/decay, duplicate/cannibalization checks, related-content links, and regionalization inputs. Scores must expose their inputs and must not fabricate popularity.
10. **SEO and structured data:** Generate canonical metadata, authorship, publication/update dates, appropriate Article/NewsArticle/VideoObject schema only when facts support it, social cards, sitemap/indexing events, and internal links.
11. **Analytics:** Emit privacy-conscious events for opportunity, research, draft, review, publication, distribution, engagement, correction, and refresh. Do not collect unnecessary personal data.
12. **Corrections:** Preserve prior versions and publish correction metadata; never silently overwrite material factual changes.

## Trust and safety constraints

- Do not scrape-and-spin competitors or reproduce copyrighted material beyond permitted excerpts.
- No fabricated facts, quotes, statistics, sources, popularity, or audience metrics.
- No auto-publishing ambiguous, sensitive, breaking, or high-impact stories.
- Label opinion, sponsored content, and simulated/demo data clearly.
- Enforce authorization on the server for every editorial mutation.
- Treat external feeds, uploaded material, and model output as untrusted.
- Respect source terms, privacy, retention, and applicable law.

## Non-functional requirements

- Provider-neutral domain contracts; Cloudflare Workers remains the deployment target.
- Use the existing Next.js, Supabase, Sentry, Nx, TypeScript, and test architecture where appropriate; do not add duplicate infrastructure without a measured need.
- Accessible editorial workflows and responsive mobile experience.
- Structured logs, correlation IDs, queue metrics, error reporting, and audit trails.
- Unit, integration, authorization, idempotency, and browser regression coverage.

## Acceptance criteria

- A story cannot be published without server-validated approval and required evidence checks.
- Each factual claim can be traced to its evidence or explicitly marked as unsupported/opinion.
- Replaying the same ingestion/job event does not create duplicate stories or derivatives.
- Conflicting or stale sources produce visible review states, not silent selection.
- A single canonical story can generate multiple derivatives without duplicate canonical URLs.
- Corrections preserve history and update downstream surfaces.
- All editorial mutations are role-authorized and audited.
- CI, Web Constitution Ship Gate, accessibility, and relevant Playwright tests pass.

## Explicitly out of scope for first release

- Automated publication without human approval.
- Full ad-serving or commerce checkout implementation.
- A new standalone CMS replacing the existing platform.
- Vendor-specific AI or sports-data coupling.
- Unbounded scraping or ingestion of unlicensed sources.

## Open questions to resolve during planning

- Existing Supabase tables and authorization model to extend versus new migrations.
- Existing editorial/admin UI surfaces to reuse.
- Exact canonical Sports Brain and Trend Intelligence event contracts.
- Queue primitive and retry model compatible with the deployed Cloudflare/Supabase architecture.
- Retention policy for source excerpts and model prompts.
