# UltraWear FC — Agent Working Agreement

Before changing the product, read:
- `README.md`
- `docs/WEB_CONSTITUTION.md`
- `docs/WEB_PLATFORM_STACK.md`
- `docs/VISUAL_ENGINE.md`
- The relevant phase/acceptance document under `docs/`

## Product direction
- FC always means **For Community**.
- Build a participatory sports-and-culture platform, not a conventional scores/news site or storefront.
- Football is the launch sport; keep domain contracts capable of expanding to other sports and lifestyle.
- Prioritise audience utility, participation, owned audience and community before commerce.
- Never describe simulated or stale sports data as live or verified.

## Engineering rules
- Work in small, reviewable vertical slices on a feature/chore branch. Do not commit directly to `main`.
- Inspect existing contracts and components before creating new ones. Extend the current architecture; avoid parallel prototypes and duplicate systems.
- Keep sports providers behind adapters. Validate external payloads at boundaries and preserve source, freshness and verification state.
- Prefer existing dependencies. A new runtime dependency requires a documented reason covering user value, bundle cost, maintenance, security, accessibility and a fallback.
- Keep visual effects progressive: essential content and navigation must work without WebGL. Respect reduced motion and use a restrained experience on small screens.
- Use semantic HTML, keyboard-accessible controls, visible focus, meaningful labels, sufficient contrast and resilient loading/empty/error states.
- Do not add credentials, tokens, private data, or real secrets to the repository.
- Do not add third-party skill files or generated assets until their licence, provenance and intended usage have been checked.

## Delivery loop
1. State the user problem and acceptance criteria.
2. Inspect the existing implementation and tests.
3. Make the smallest coherent change.
4. Add or update tests for the behaviour.
5. Run the relevant checks: `npm run constitution:check`, `npm run check`, `npm run lint`; run `npm run build` and relevant Playwright tests for significant UI or route changes.
6. Report exactly what changed, what was tested, and what remains unverified.

## Design and motion
- Use the in-repo UltraWear tokens and components as the source of truth.
- Motion must communicate hierarchy, state or feedback—not decorate every element.
- Design responsive and touch behaviour intentionally; do not merely shrink desktop layouts.
- Keep text, controls and essential information in accessible DOM rather than embedding them in a canvas or shader.
