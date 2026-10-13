# Sprint close-out — 13 October 2026

Scope: unblock CI, restore the type/lint/build gates, close the sports-data trust
gap, and make participation rewards server-authoritative and idempotent.

## Evidence

- Branch `fix/react-peer-dependency-ci` → PR #88.
- Branch `fix/sports-trust-and-participation` → PR #89.
- CI on PR #88: install, Nx verify gate, Playwright browser install, build all PASS.
  The `verify` job fails only at "Browser regression gates" on pre-existing tests.
- CI on PR #89: Nx verify gate PASS; browser gate fails only on the 3 pre-existing tests below.

## Status

| Item | Status | Evidence |
| --- | --- | --- |
| React 19 peer conflict / `ERESOLVE` | PASS | `@react-three/fiber` 9.8.1; `npm install` succeeds in CI (PR #88) |
| Production TS error (`lib/sports/providers.ts`, #86) | PASS | `npm run check` exit 0 |
| Lint gate (#80) | PASS | `npm run lint` exit 0 (268 files) |
| Constitution check | PASS | `npm run constitution:check` |
| Production build | PASS | `npm run build` exit 0 |
| Sports trust labels (PR #87 intent) | PASS | Simulator events `unverified`; UI labels simulated/stale; PR #87 duplicated fragment removed |
| Server-authoritative participation | PASS | `lib/participation/actions.ts`; client `points`/`kind` rejected 400 |
| Idempotent / atomic awards | NOT VERIFIED | Code + migration added; RPC not executed against a live DB |
| Full e2e / a11y | FAIL (pre-existing) | 93 passed, 3 failed (see below) |

## Remaining failures (pre-existing, identical on `main`)

1. `/` a11y: decorative `aria-hidden` FC watermark contrast (`.uw-community__fc`,
   `#262623` on `#111110`). Design call — changing it alters the intended low-contrast effect.
2. `tests/e2e/weekend-gallery.spec.ts` (chromium + mobile): `WeekendGallery` is defined
   in `components/weekend-gallery.tsx` but rendered nowhere; the test asserts it is visible
   on `/`. Its CSS lives in `app/visual-engine.css` and is styled for a dark surface
   (light text, no background), so wiring it onto the light home page is a product/design
   decision, not a mechanical fix.

Baseline on `main` failed 10 a11y/e2e checks; this branch fails 3. No new regressions.

## Blockers / dependencies

- Durable participation path requires applying `supabase/participation-v2.sql` and running
  the e2e suite with Supabase configured, to move "NOT VERIFIED" to PASS.

## Next action

- Decide the weekend gallery's home: render it on `/` (with a real, non-dead-end data source)
  or retarget/retire its test and relocate its CSS. Then close the last `/` contrast item.

## Human decision needed

- Weekend gallery placement and surface styling.
- Approval to merge PR #88 and PR #89 (no production merge performed by the agent).
