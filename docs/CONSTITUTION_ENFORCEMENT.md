# Constitution Enforcement

The UltraWear FC Web Constitution is an engineering gate, not documentation that can be ignored.

## Automated gate

`npm run constitution:check` runs in CI before type checking and production build.

The check currently enforces:

- The constitution and required product-governance files exist.
- Core constitutional principles remain present in the constitution.
- The root experience retains an accessible skip link and the FC identity.
- Privacy and Terms remain reachable from the global footer.
- Baseline browser security headers remain configured.
- Primary product routes remain represented in the sitemap.
- Hard-coded internal links in the Next.js app and components resolve to an existing route.

A failed check blocks the CI job and therefore blocks a constitution-compliant merge path.

## Human gate

Automation cannot determine whether a feature is genuinely useful, culturally appropriate, truthful, accessible in practice, or good for the community.

Those questions remain part of the Ship Gate in `docs/WEB_CONSTITUTION.md` and must be considered in product/design/code review.

## Rule

**The automated gate catches known violations. Human review owns the principles automation cannot reliably judge.**

When an exception is necessary, document the reason, affected principle, owner, risk, and review/expiry point according to Article XIII of the constitution.
