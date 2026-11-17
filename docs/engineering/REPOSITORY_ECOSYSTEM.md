# UltraWear FC — Engineering Repository Ecosystem

**Status:** Initial evaluation register  
**Owner:** UltraWear FC engineering  
**Primary repository:** https://github.com/unify-aiprog/ultrawear  
**Product principle:** FC means **For Community**.

This register distinguishes repositories that are already part of the UltraWear stack from external references and candidates. A repository being listed does not mean its code is approved for production use or has been integrated.

## Integration rules

1. The UltraWear repository and its domain model remain the source of truth.
2. Reuse a library or a narrowly scoped implementation pattern; do not import entire applications or duplicate platform foundations.
3. Verify the exact repository, current maintenance state, licence, security posture, dependencies, runtime compatibility, and Cloudflare Workers compatibility before adoption.
4. Keep external providers behind adapters and preserve provider-neutral domain contracts.
5. Never copy secrets, credentials, datasets, user content, or production configuration from reference repositories.
6. Run the Web Constitution Ship Gate, type checks, lint, build, accessibility checks, and relevant browser tests for every integration.
7. Use security-testing tools only against UltraWear-owned or explicitly authorized environments.
8. Commerce examples remain deferred until the content, audience, and community foundations are ready.

## A. Existing UltraWear foundations — keep and improve

| Capability | Current implementation | Decision |
|---|---|---|
| Web framework | Next.js 15 / React 19 | Already adopted; keep canonical |
| Cloud deployment | OpenNext for Cloudflare Workers, Wrangler | Required deployment target; do not move to Vercel |
| 3D / immersive UI | React Three Fiber, Three.js, Paper shaders, ShaderGradient, LiquidGlassJS | Already present; use selectively with mobile, performance, and reduced-motion safeguards |
| Error monitoring | Sentry | Already present; verify release/source-map and alert configuration |
| Browser testing | Playwright + axe | Already present; expand coverage |
| Data and identity | Supabase | Already present; keep server-side authorization and durable writes |
| Code quality | TypeScript, Biome, Nx, constitution checks | Already present; keep as mandatory gates |

## B. Repositories explicitly requested or recovered for this workflow

| Repository | Intended UltraWear use | Evaluation / decision |
|---|---|---|
| [GitHub Spec Kit](https://github.com/github/spec-kit) | Feature specifications, acceptance criteria, implementation plans | **Adopt as a planning workflow**, not a runtime dependency. Pilot on one new platform capability and keep specs in this repository. |
| [PentAGI](https://github.com/vxcontrol/pentagi) | Autonomous security assessment | **Evaluate for isolated staging only.** No production credentials; require explicit scope, authorization, and human review of findings. |
| [Zie619/n8n-workflows](https://github.com/Zie619/n8n-workflows) | Sports-content and operations automation patterns | **Reference only initially.** Review each workflow for credential handling, untrusted input, licensing, and duplicate triggers before adapting. |
| [Cloudflare Flan Scan](https://github.com/cloudflare/flan) | Vulnerability scanning reference | **Do not adopt as a new dependency:** repository is archived. Evaluate maintained scanners and Cloudflare-native controls instead. |
| [Free-LLM-API candidate](https://github.com/golapkamal/Free-LLM-API) | Low-cost model access for research and content assistance | **Unverified for production.** Verify upstream identity, terms, provider reliability, rate limits, data handling, and licence. Never route confidential data through an untrusted proxy. |
| [Design-clone candidate](https://github.com/bienhoang/design-clone) | Study high-quality layouts and reproduce interaction patterns | **Reference only.** Verify licence and source ownership; use as design research, not permission to copy protected brand assets or proprietary code. |

## C. Additional engineering references

| Repository | Intended use | Decision |
|---|---|---|
| [Vercel AI SDK](https://github.com/vercel/ai) | Provider-neutral model integration and streaming patterns | Evaluate a small proof of concept only after checking Cloudflare Workers adapter/runtime compatibility. |
| [Supabase Vercel AI Chatbot](https://github.com/supabase-community/vercel-ai-chatbot) | Chat UX, Supabase patterns, conversation persistence | Reference only; adapt individual patterns, not the Vercel deployment assumptions or whole application. |
| [PostHog](https://github.com/PostHog/posthog) | Product analytics, funnels, retention, feature flags | Evaluate when the event taxonomy, consent model, privacy controls, and audience KPIs are defined. Avoid collecting unnecessary personal data. |
| [Sentry](https://github.com/getsentry/sentry) | Error monitoring | Already integrated through the Sentry SDK; use upstream docs and release notes rather than adding a second monitoring system. |
| [Next.js](https://github.com/vercel/next.js) | Framework reference | Already adopted. Track compatibility and security updates; Cloudflare remains the deployment target. |
| [Next.js Subscription Payments](https://github.com/vercel/nextjs-subscription-payments) | Subscription / commerce patterns | **Exclude from current phase:** archived and commerce is deliberately later. |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | Component implementation patterns | Evaluate selectively; preserve the existing React Aria accessibility foundation and UltraWear design system. |
| [Playwright](https://github.com/microsoft/playwright) | End-to-end and browser regression tests | Already adopted; expand critical user journeys and accessibility coverage. |
| [Vitest](https://github.com/vitest-dev/vitest) | Fast unit and component tests | Evaluate only where current test tooling leaves a measurable gap; avoid duplicate test runners without a clear benefit. |
| [Tesseract.js](https://github.com/naptha/tesseract.js) | OCR for permitted image/document ingestion | Defer until a real editorial or community use case exists; evaluate Worker compatibility and resource cost first. |

## D. Integration sequence

### P0 — Restore a trustworthy engineering baseline
- Resolve the React / React Three Fiber peer dependency conflict.
- Keep dependency installation deterministic; commit a lockfile only after generating and validating it with the repository's supported Node/npm toolchain.
- Require CI to reach and pass constitution, type, lint, build, Playwright, and accessibility gates.
- Review existing open PRs for stale branches and overlapping changes before merging.

### P1 — Standardize how new work is specified
- Pilot GitHub Spec Kit on the next Sports Intelligence or Content Core feature.
- Store the accepted specification, plan, tasks, and verification evidence in the UltraWear repository.
- Make the Web Constitution the governing product and quality standard.

### P2 — Improve sports intelligence and content operations
- Build the UltraWear-owned source-ingestion, provenance, validation, and reconciliation layer.
- Evaluate n8n patterns for scheduled ingestion, editorial review queues, and distribution; keep business rules and trust validation inside UltraWear-owned services.
- Evaluate AI SDK / model gateways behind a provider-neutral interface. AI may assist research and drafting but must not publish unverified sports claims.

### P3 — Audience and reliability
- Define a privacy-conscious analytics event taxonomy before selecting or expanding PostHog.
- Improve Sentry alerting and Playwright coverage for live, community, identity, and return journeys.
- Add OCR only when it supports a validated product workflow.

### P4 — Authorized security verification
- Review Cloudflare security configuration and maintained scanning alternatives.
- Run PentAGI or other active scanners only in isolated, explicitly authorized staging.
- Record findings, severity, remediation, and retest evidence.

## E. Current adoption status

- **Already in the product:** Next.js, Cloudflare OpenNext/Wrangler, React Three Fiber, Three.js, Sentry SDK, Supabase, Playwright, axe, TypeScript, Biome, Nx.
- **Planning / evaluation workflow:** GitHub Spec Kit.
- **Security evaluation only:** PentAGI; maintained alternatives to archived Flan Scan.
- **Automation reference only:** Zie619/n8n-workflows.
- **Research candidates:** Free-LLM-API and design-clone candidates; identity and suitability are not yet approved.
- **Deferred / conditional:** PostHog, Vercel AI SDK, Vitest, shadcn/ui, Tesseract.js.
- **Not for current adoption:** archived Next.js Subscription Payments starter; archived Cloudflare Flan Scan.

## F. Definition of done for an integration

An integration is complete only when the pull request records:
- exact upstream repository, version or commit, and licence;
- why the capability is needed and why existing code is insufficient;
- security, privacy, dependency, and Cloudflare compatibility review;
- the UltraWear-owned adapter or boundary (where applicable);
- tests and Web Constitution Ship Gate evidence;
- operational ownership, rollback path, and update strategy.

A link in this register is not evidence of integration. Only merged, tested code counts as adopted.


## G. Newly reviewed repositories and skills — November 2026

The following candidates were screened against UltraWear's current priorities: sports-content operations, global audience acquisition, interactive community, immersive UX, engineering throughput, and safe operation on the existing Cloudflare/Supabase architecture. **These are recommendations, not integrations.**

### Adopt selectively as engineering / agent skills

| Candidate | UltraWear value | Decision / guardrail |
|---|---|---|
| [Corey Haines — Marketing Skills](https://github.com/coreyhaines31/marketingskills) | SEO, analytics, growth experiments, conversion, onboarding, retention loops, and marketing planning | **High priority.** Review and add the relevant skill files to the agent workflow. Use for audience growth and community activation; do not blindly automate paid campaigns or publish claims. MIT-licensed. |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Design intelligence and repeatable UI/UX direction across platforms | **High priority.** Use as design-review and implementation guidance; keep UltraWear's own design system and accessibility rules authoritative. MIT-licensed per repository metadata. |
| [Emil Kowalski — Skills](https://github.com/emilkowalski/skills) | Motion, animation performance, gestures, mobile-native behaviour, interface review | **High priority.** Adopt relevant skills for the immersive, game-like experience; motion must respect reduced-motion preferences and mobile performance. |
| [Graphify](https://github.com/Graphify-Labs/graphify) | Queryable graph of source code, docs, SQL schemas, and configuration | **High priority for engineering.** Pilot on the repository to improve architecture discovery and impact analysis. Review generated graph output and hooks before committing. |
| [RTK — Rust Token Killer](https://github.com/rtk-ai/rtk) | Compresses common CLI output to reduce coding-agent context and cost | **High priority for developer tooling.** Pilot in the developer environment, not the deployed app. Review hooks and pipelines before enabling command rewriting; do not install unreviewed community pipelines. Apache-2.0. |
| [Ponytail](https://github.com/DietrichGebert/ponytail) | Agent guidance to favour simpler implementations and tests over unnecessary code | **Selective pilot.** Use as a review discipline, not as authority to skip necessary architecture, accessibility, security, or tests. MIT. |
| [Humanizer](https://github.com/blader/humanizer) | Editorial pass for unnatural or formulaic AI-generated prose | **Selective editorial skill.** Apply only after factual/editorial approval; never change quoted sources, athlete statements, statistics, legal notices, or attributed copy. MIT. |

### Useful production / operations tools — not platform dependencies

| Candidate | UltraWear value | Decision / guardrail |
|---|---|---|
| [OpenSEO](https://github.com/every-app/open-seo) | Keyword research, rank tracking, competitor gaps, site audits, backlinks, AI-search visibility | **High priority for audience acquisition.** Pilot on the public site. It relies on DataForSEO for data, so budget and review API terms, data handling, and query costs. MIT. |
| [Cap](https://github.com/CapSoftware/Cap) | Record, edit, caption, and share production walkthroughs, tutorials, partner demos, and creator onboarding | **Useful for the media/operations team.** Evaluate as a production tool; do not embed its app or use it as UltraWear's video platform. Most of the project is AGPLv3, with separately licensed components. |
| [VoiceStudio](https://github.com/debpalash/VoiceStudio) | Local voice-over, narration, dubbing, transcription, and audio production | **Optional media workflow.** Test with original/authorized voices only. App is AGPL-3.0; model weights, voices, and outputs have separate terms. |
| [OpenWhispr](https://github.com/OpenWhispr/openwhispr) | Private dictation and meeting transcription for editorial interviews and internal notes | **Optional team productivity tool.** Desktop application, not a web-platform dependency. MIT; review consent and retention before recording interviews. |
| [Chatwoot](https://github.com/chatwoot/chatwoot) | Omnichannel support inbox, help centre, contact history, campaigns, and support automation | **Later-stage operations candidate.** Consider when member support volume justifies a dedicated team inbox. Do not mistake customer support software for the participatory community product. MIT. |
| [Cal.diy](https://github.com/calcom/cal.diy) | Scheduling creator interviews, partner calls, and community events | **Low-priority operations candidate.** Its fork removes team/enterprise capabilities; validate integrations and current maintenance before any production deployment. MIT. |

### Reference only, defer, or reject for now

| Candidate | Assessment | Decision |
|---|---|---|
| [Open Higgsfield](https://github.com/wide-trace/open-higgsfield) | A studio UI that orchestrates external image/video model APIs; not itself a generation model. The repository page reviewed did not show a licence file. | **Do not copy, fork, or deploy commercially until an explicit licence is supplied.** We can evaluate the workflow conceptually; use licensed media providers for production. |
| [AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) | Full collaborative workspace / Notion alternative, built with Flutter and Rust; AGPL-3.0. | **Do not integrate into the UltraWear product.** At most evaluate as an internal team wiki; avoid creating a second content/CMS system when UltraWear already has Content Core and its own data model. |
| [OpenProject](https://github.com/opf/openproject) | Full project and portfolio management platform; GPLv3 and self-hosted operational footprint. | **Defer.** GitHub Issues/Projects and the existing repository workflow are sufficient for current engineering execution. Revisit only if operations require formal portfolio/Gantt planning. |
| [OpenWhispr](https://github.com/OpenWhispr/openwhispr) | Already listed above as optional desktop dictation. | Do not import its Electron stack into the web app. |
| [PentAGI](https://github.com/pentagi-oss/pentagi) | The repository currently discoverable under this owner is archived/read-only; autonomous penetration testing is high risk. | **Do not adopt this archived repository.** If autonomous security testing is later needed, select a maintained scanner and run only in isolated, explicitly authorized staging. |
| [Lemo-Opuscar](https://github.com/search?q=Lemo-Opuscar&type=repositories) | The exact project identity could not be reliably verified from the supplied name. | **Unverified — no adoption.** Need the exact repository URL before review. |

### Recommended execution order

1. **Engineering leverage:** pilot RTK, Graphify, Ponytail, and the relevant Emil/UI UX Pro Max skills in the developer workflow. Keep agent instructions project-scoped and review hooks before enabling them.
2. **Audience growth:** pilot OpenSEO and selected Corey Haines marketing skills against UltraWear's real content taxonomy, search intent, analytics events, and distribution channels.
3. **Experience quality:** use Emil's motion/interaction guidance and UI UX Pro Max to review the existing interactive experience, not to replace its architecture.
4. **Editorial/media operations:** trial Humanizer, Cap, VoiceStudio, or OpenWhispr only against real editorial/production needs and with rights/consent controls.
5. **Community operations:** revisit Chatwoot and Cal.diy when support and event workflows are established. Keep the member identity, progression, participation, and community experience UltraWear-owned.

### Adoption boundary

No full application from this list should be copied into the UltraWear runtime by default. Prefer small, attributable, license-compatible agent skills and workflow patterns. Production integrations must fit Next.js + Cloudflare OpenNext + Supabase, preserve the existing Content Core and publishing pipeline, and pass the repository's quality and security gates. Licences for AGPL/GPL applications require legal review before any code is incorporated into a proprietary product.
