# UltraWear FC Web Platform Stack

The UltraWear web stack is intentionally layered. Libraries are adopted because they solve a product problem and are governed by the Web Constitution.

## Experience

- Paper Design Shaders / LiquidMetal — liquid identity treatments.
- ShaderGradient — atmospheric WebGL gradients.
- LiquidGlassJS — progressive glass/refraction treatment with fallback behavior.
- React Three Fiber + Three.js — bounded 3D experiences.
- Motion — UI transitions and micro-interactions.

## Design & accessibility

- React Aria Components — accessible interaction primitives without prescribing the UltraWear visual language.
- UltraWear CSS/tokens — brand ownership remains in-repo.

## Reliability & data integrity

- React Error Boundary — isolates component failures.
- Sentry — optional runtime observability; disabled unless a DSN is configured.
- Zod — validation boundary for normalized sports data.
- TanStack Query — intended cache/revalidation layer for live data surfaces.

## Quality & performance

- React Scan — development-time render inspection.
- Playwright — browser and responsive regression coverage.
- axe-core / Playwright — automated accessibility regression checks.
- Biome — formatting and linting gate.
- Next bundle analyzer — opt-in bundle inspection via `ANALYZE=true`.

## Constitutional rules

1. Visual effects are enhancement layers, never the source of essential information.
2. Reduced motion disables animated shader/3D behavior.
3. Small screens do not pay for the full 3D experience.
4. WebGL failure must not block navigation, content, accessibility, or sports information.
5. External sports data must pass validation and retain provenance/freshness semantics.
6. Runtime failures must degrade to useful UI states.
7. Quality gates run in CI before merge.
8. Dependencies are pinned or intentionally ranged according to upstream release discipline; unstable `0.x` shader packages are pinned exactly.
9. New libraries must justify their bundle, maintenance, security, and accessibility cost.

## Current status

This branch establishes the foundation and CI gates. Real-user Core Web Vitals monitoring, React Scan development instrumentation, and deeper performance budgets should be enabled after the first verified production deployment so thresholds are based on actual traffic and device evidence rather than guesses.
