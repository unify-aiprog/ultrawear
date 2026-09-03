# UltraWear FC — Global Catalogue Model

UltraWear FC uses a global sports catalogue rather than a league-only content model.

## Entity hierarchy

`Sport → Country → Competition → Season → Organization → Team → Person → Event`

### Competition dimensions
- sport
- country (nullable for global competitions)
- competition type: league, cup, tournament, etc.
- gender: men, women, mixed
- age group: senior, U21, U19, U18, youth, etc.
- level
- season

### Team dimensions
- organization/club relationship
- country
- team type: club, national, reserve, academy, representative, etc.
- gender
- age group
- level

A team is not owned by a single competition. `team_competitions` records participation by competition and season.

Players and staff are people. `team_memberships` records role, position, shirt number and season so historical squads remain representable.

## Product rule

Football is the launch sport, but the model is sport-agnostic. Worldwide data coverage should populate the catalogue wherever the chosen provider exposes it; editorial depth is a separate product concern.
