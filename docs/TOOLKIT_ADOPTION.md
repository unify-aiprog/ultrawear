# UltraWear FC — Engineering & Creative Toolkit Adoption

This document maps the shortlisted open-source tools and skills to the existing UltraWear FC architecture. It is an adoption plan, not a mandate to install every repository.

## Guiding rule

Adopt tools that improve the product or delivery workflow. Keep most tools outside the production runtime. The UltraWear codebase, design tokens, domain contracts and Web Constitution remain authoritative.

## Adopt now: coding and design workflow

| Tool / project | Role at UltraWear | Adoption decision |
|---|---|---|
| Matt Pocock's Engineering Skills | Specification quality, TypeScript practices, code review and maintainable implementation | Use as an engineering-agent reference after licence/source review; do not add runtime dependencies |
| UI UX Pro Max | Design-system exploration, layout and interface critique | Use for design exploration; reconcile all output with UltraWear tokens and accessibility rules |
| Emil Kowalski's design/animation skills | Interaction detail, motion, transitions and micro-interactions | Use selectively; Motion is already in the stack, so avoid adding a second animation framework |
| Graphify | Optional codebase relationship mapping for coding agents | Evaluate on a development copy; generated graphs are disposable context, not canonical architecture docs |
| RTK | Reduce terminal output and agent context overhead | Optional local developer tool; never part of the deployed app |
| Ponytail | Coding-agent workflow/review assistance | Verify the exact upstream repository and licence before adoption; no production dependency yet |

## Adopt for creative production

| Tool / project | Role at UltraWear | Adoption decision |
|---|---|---|
| Open Higgsfield | Campaign concepts, editorial visuals, launch films and social video production | Creative-team tool; check provider credentials, output rights, consent and provenance before publishing |
| VoiceStudio | Voiceover, narration and multilingual audio production | Creative-team tool; obtain voice consent/licensing and label synthetic narration where appropriate |
| Cap | Product demos, tutorials and internal walkthroughs | Optional production workflow; not a platform dependency |

Generated visuals must not be presented as authentic match photography, real player actions or documentary evidence. Respect likeness, trademark, competition and media rights.

## Adopt later: audience operations

| Tool / project | Role at UltraWear | Adoption decision |
|---|---|---|
| AppFlowy | Internal knowledge base, editorial playbooks, research and team operations | Optional internal workspace; do not make the public platform depend on it |
| Corey Haines Growth Skills | Audience acquisition, onboarding, retention and experiment design | Use as a growth playbook; experiments must respect the Web Constitution and user privacy |
| OpenSEO | Technical SEO and keyword/competitor research | Evaluate after the publishing/discovery workflow is stable; check external API costs and data terms |
| Chatwoot | Community support and partnership inbox | Consider when support volume justifies a dedicated service; define moderation, retention and escalation policy first |
| OpenProject | Project planning and delivery coordination | Defer unless the team outgrows GitHub issues/projects and its existing workflow |
| OpenWhispr | Local voice dictation for internal notes | Optional individual productivity tool |
| Cal.diy | Booking creator interviews, events and partner meetings | Defer until recurring scheduling needs exist |

## Security and specialist tooling

| Tool / project | Role at UltraWear | Adoption decision |
|---|---|---|
| PentAGI | Controlled security assessment of owned systems | Later-stage security tool only; isolate it, use explicit scope and authorisation, and review findings with a security owner |
| Humanizer | Editorial copy review | Optional editorial aid; preserve factual accuracy, voice and human editorial review |
| Lemo-Opuscar | Not confidently identified from the supplied name | Do not adopt until the exact repository URL and purpose are confirmed |

## Existing capabilities — do not duplicate

The repository already includes:
- Next.js and React for the web application.
- Three.js and React Three Fiber for bounded 3D.
- Motion and GSAP for animation.
- Paper Design Shaders, ShaderGradient and LiquidGlassJS for progressive visual treatments.
- React Aria Components for accessible interaction primitives.
- Zod and provider-neutral sports contracts for data validation.
- Playwright, axe-core, Biome and TypeScript checks for quality.

Therefore:
- Do not add another 3D engine or animation framework without a concrete gap.
- Do not add OpenSEO as a runtime package; use it as an external research workflow if selected.
- Do not connect Chatwoot, AppFlowy or OpenProject to the public product by default.
- Do not put AI-generated sports facts directly into publishing without evidence and editorial approval.

## Adoption gates

Before adding any tool, record:
1. The specific workflow or user problem it solves.
2. Whether it is a local tool, internal service, external SaaS or production dependency.
3. Licence, maintenance activity, security posture and data handling.
4. Cost, credentials and provider lock-in.
5. Accessibility, privacy, content provenance and rights implications.
6. A fallback and an owner responsible for updates.

## First execution sequence

1. Apply `AGENTS.md` to coding-agent work.
2. Use existing Motion, React Three Fiber and React Aria foundations; do not install duplicate libraries.
3. Trial UI UX Pro Max and Emil Kowalski's skills on one contained interface improvement.
4. Trial Graphify and RTK locally against the repository; keep their outputs out of production.
5. Build a repeatable Open Higgsfield/VoiceStudio content workflow with rights and provenance checks.
6. Add audience operations tools only when the relevant publishing and community workflows are ready.
