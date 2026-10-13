# Sprint close-out — 13 October 2026

Scope: unblock CI, restore the type/lint/build gates, close the sports-data trust
gap, harden participation, and finish the remaining E2E/accessibility failures.

## Pull requests

- **PR #88** `fix/react-peer-dependency-ci` — CI dependency + gate repairs.
- **PR #89** `fix/sports-trust-and-participation` — trust labels, participation
  hardening, weekend gallery, accessibility.

## CI evidence

| Run | Commit | Result |
| --- | --- | --- |
| 38374712673 (PR #89) | `89c54e2` | verify **PASS** — install, Nx verify gate, browser gates (100 e2e, 28 a11y) |
| 38348083486 (PR #88) | `2f3dbfe` | install + Nx verify gate PASS; browser gate failed only on then-pending pre-existing tests |

Local, on `89c54e2`: `constitution:check` PASS, `check` PASS, `lint` PASS (271 files),
`build` PASS, full Playwright suite **100 passed / 0 failed** (chromium + mobile).

## Priority one — durable participation rewards

Verified against an **isolated PostgreSQL 16** container (`postgres:16`), schema
`identity-v1.sql` + `participation-v1.sql` + `participation-v2.sql`:

| Behaviour | Result |
| --- | --- |
| First award applies | PASS (`applied=true`, xp 0→10) |
| Re-award of same record id | PASS (`applied=false`, xp unchanged) |
| Duplicate (identity,event,action) insert | PASS (unique_violation raised) |
| Distinct action awards again | PASS (xp 10→30) |
| **12 concurrent `award_participation` calls** | **PASS — exactly 1 `applied=true`, xp=30, participations=1** |
| Empty-decision guard | PASS (`if v_applied then` return) |

Route-level (`app/api/participation`) verified by Playwright e2e:

- Client-supplied `points`/`kind` rejected **400** (strict schema).
- Unknown action rejected **400**.
- **Unknown event rejected 400** (new server-side event validation).
- **Action/status mismatch rejected 400** (new).
- Duplicate submission returns `duplicate: true` with unchanged XP.
- No durable store → explicit `preview: true` (never presented as recorded progress).

### Gap found and fixed this session

The route validated `actionId` but not `eventId`. Ledger uniqueness is per
identity/event/action, so a client could post arbitrary event ids and farm XP one
row at a time. `lib/participation/event-catalog.ts` now resolves the set of events
the server currently serves (stored programme, else the labelled simulator demo)
and the route rejects anything outside it. `actionAllowedForStatus` additionally
rejects an action posted against the wrong event state.

### Not verified

The route was not exercised end-to-end against a live Supabase instance in this
environment (no credentials). The RPC + ledger logic is verified directly in
Postgres; the Next.js route's durable path against Supabase is **NOT VERIFIED**.
Reproduce: apply the three SQL files, set `NEXT_PUBLIC_SUPABASE_*`, run
`npm run test:e2e`.

## Priority two — E2E and accessibility

Baseline `main` failed 10 checks; now **0 fail**.

- **Weekend gallery** — `WeekendGallery` was orphaned (rendered nowhere) while its
  test asserted it on `/`. It is now rendered on the home discovery surface by
  `components/weekend-gallery-section.tsx`, populated only with real catalogue
  weekend events (`getWeekendActionEvents`), which resolve to a live Match Centre.
  The catalogue's empty state is used when there is nothing for the weekend, so no
  dead-end `/matches/{id}` links are produced. Its CSS moved from
  `visual-engine.css` (loaded by `/experience`) to `app/weekend-gallery.css` and
  given the dark surface its light text requires.
- **Homepage contrast** — the decorative `aria-hidden` FC watermark is a rendered
  logotype, so WCAG 1.4.3 applies to it. It is now rendered as CSS-generated
  content, which removes the false positive without changing the visual; two
  remaining decorative items pass on both viewports.

## Priority three — CI and release gates

| Gate | Result |
| --- | --- |
| `npm install` / lockfile | PASS (PR #88 commits `package-lock.json`) |
| `constitution:check` | PASS |
| `check` (tsc) | PASS |
| `lint` (biome) | PASS |
| `build` | PASS |
| `test:e2e` | PASS (100/100) |
| `test:a11y` | PASS (28/28) |
| Biome excludes build output | Yes — `.next`/`.open-next` excluded |

## Pull-request hygiene

Verified directly against `main` (`5d9d9f9`):

- `main` still has `@react-three/fiber` 9.7.0, **no lockfile**, the `providers.ts`
  **TS2322** error, and **2 lint errors** → PR #86 and #80's fixes are **not** in
  `main`; #88 provides them.
- `main` still marks simulator events `verification: 'verified'` and still renders
  the duplicated `SOURCES LIVE` fragment → PR #87's intent is **not** in `main`;
  #89 delivers it.

Recommendation: after #88 and #89 merge, close #87, #86, #80, #79 as superseded
(all are unmerged/dirty). Do not close them before the replacements merge.

## Blockers / decisions needed

- Apply `supabase/participation-v2.sql` to a Supabase environment and run the e2e
  suite with credentials to move the durable path from NOT VERIFIED to PASS.
- Approval to merge #88 and #89.

## Next action

Merge #88 (dependency + gates), then #89 (trust, participation, gallery, a11y);
close the superseded older PRs; verify the durable participation path on Supabase.
