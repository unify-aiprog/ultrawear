# Fan UX Architecture

UltraWear FC is a sports platform **for fans**. `FC` means **For Community**. This phase is not the fashion arm.

## Primary loop

`Discover → Follow → Watch live → React/participate → Receive update → Return`

## Home hierarchy

1. Breaking/live state
2. Personalized followed teams/competitions
3. Live and upcoming matches
4. Important sports news
5. Trending stories and events
6. Sport discovery
7. Community/predictions/polls

The ordering should adapt to user behavior while preserving a strong default experience for anonymous visitors.

## Match card requirements

Show at a glance:

- competition
- teams/players
- score or scheduled time
- match status
- live event indicator when applicable
- venue/context where useful
- follow/notification action

## News card requirements

Show:

- headline
- timestamp/freshness
- sport/competition
- image when licensed
- source/credit when required
- content type

## States

Every data-driven surface needs loading, empty, stale, unavailable and error states. Never present missing live data as a confirmed fact.

## Engagement

Build foundations for follows, saves, reactions, polls, predictions, notifications and personalized feeds. Engagement must be useful rather than manipulative: no fake urgency, deceptive notifications or dark patterns.
