# Phase 3 — Publishing + Discovery Acceptance

## Contract
- Approved Content Core revisions can become canonical article documents.
- Canonical URLs are deterministic and provider-neutral.
- Draft/unapproved stories cannot enter the canonical publishing contract.

## Search and discovery
- SEO metadata always exposes title, description and canonical URL.
- Structured data is generated only from supplied verified article fields.
- Entity/topic/event hubs have durable IDs, slugs and URLs.
- Related content excludes the current story and ranks shared entities/topics first.
- Sitemap entries are canonical, deduplicated and XML-safe.

## Editorial safety
- No publishing function auto-approves or auto-publishes content.
- No metadata generator fabricates authors, dates, publishers, claims or quotes.
- Opinion/sponsored labeling remains available to the eventual rendering layer.

## Exit
An approved story can be handed to a future CMS adapter with a durable URL, search metadata, structured data, entity relationships and sitemap participation, without coupling the Content Core to a specific vendor.

Test command: `node publishing/publishing.test.js`
