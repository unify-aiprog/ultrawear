-- UltraWear FC catalogue model v2
-- Global sports graph: sport -> country -> competition -> season -> organization -> team -> person -> event

create table if not exists sports (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists countries (
  id text primary key, name text not null, slug text not null unique, code text, flag_emoji text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists competitions_v2 (
  id text primary key, sport_id text not null references sports(id) on delete restrict,
  country_id text references countries(id) on delete set null, name text not null, slug text not null unique,
  competition_type text not null default 'league', gender text not null default 'men', age_group text not null default 'senior',
  level text, emblem_url text, provider text, provider_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists seasons (
  id text primary key, sport_id text not null references sports(id) on delete restrict,
  competition_id text not null references competitions_v2(id) on delete cascade, name text not null, slug text not null,
  start_date date, end_date date, current boolean not null default false, provider text, provider_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (competition_id, slug)
);
create table if not exists organizations (
  id text primary key, sport_id text not null references sports(id) on delete restrict,
  country_id text references countries(id) on delete set null, name text not null, slug text not null unique,
  organization_type text not null default 'club', logo_url text, provider text, provider_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists teams_v2 (
  id text primary key, sport_id text not null references sports(id) on delete restrict,
  organization_id text references organizations(id) on delete set null, country_id text references countries(id) on delete set null,
  name text not null, short_name text, slug text not null unique, team_type text not null default 'club',
  gender text not null default 'men', age_group text not null default 'senior', level text, crest_url text,
  provider text, provider_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists team_competitions (
  id bigserial primary key, team_id text not null references teams_v2(id) on delete cascade,
  competition_id text not null references competitions_v2(id) on delete cascade, season_id text not null references seasons(id) on delete cascade,
  role text not null default 'participant', created_at timestamptz not null default now(), unique (team_id, competition_id, season_id)
);
create table if not exists persons_v2 (
  id text primary key, sport_id text not null references sports(id) on delete restrict, name text not null, slug text not null unique,
  person_type text not null default 'player', image_url text, nationality_country_id text references countries(id) on delete set null,
  birth_date date, provider text, provider_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists team_memberships (
  id bigserial primary key, team_id text not null references teams_v2(id) on delete cascade, person_id text not null references persons_v2(id) on delete cascade,
  season_id text not null references seasons(id) on delete cascade, role text not null default 'player', shirt_number integer, position text,
  joined_at date, left_at date, unique (team_id, person_id, season_id, role)
);
create table if not exists venues (
  id text primary key, name text not null, slug text not null unique, country_id text references countries(id) on delete set null,
  city text, capacity integer, image_url text, provider text, provider_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists events_v2 (
  id text primary key, sport_id text not null references sports(id) on delete restrict, competition_id text references competitions_v2(id) on delete set null,
  season_id text references seasons(id) on delete set null, home_team_id text references teams_v2(id) on delete set null,
  away_team_id text references teams_v2(id) on delete set null, venue_id text references venues(id) on delete set null,
  starts_at timestamptz, status text, home_score integer, away_score integer, round_name text, provider text, provider_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists competition_standings (
  id bigserial primary key, competition_id text not null references competitions_v2(id) on delete cascade,
  season_id text not null references seasons(id) on delete cascade, position integer not null,
  team_id text not null references teams_v2(id) on delete cascade, played integer, won integer, drawn integer, lost integer,
  goals_for integer, goals_against integer, goal_difference integer, points integer, provider text, provider_id text,
  updated_at timestamptz not null default now(), unique (competition_id, season_id, team_id)
);

create unique index if not exists competitions_v2_provider_uidx on competitions_v2(provider, provider_id) where provider is not null and provider_id is not null;
create unique index if not exists seasons_provider_uidx on seasons(provider, provider_id) where provider is not null and provider_id is not null;
create unique index if not exists organizations_provider_uidx on organizations(provider, provider_id) where provider is not null and provider_id is not null;
create unique index if not exists teams_v2_provider_uidx on teams_v2(provider, provider_id) where provider is not null and provider_id is not null;
create unique index if not exists persons_v2_provider_uidx on persons_v2(provider, provider_id) where provider is not null and provider_id is not null;
create unique index if not exists venues_provider_uidx on venues(provider, provider_id) where provider is not null and provider_id is not null;
create unique index if not exists events_v2_provider_uidx on events_v2(provider, provider_id) where provider is not null and provider_id is not null;
create index if not exists competitions_v2_sport_country_idx on competitions_v2(sport_id, country_id);
create index if not exists competitions_v2_type_idx on competitions_v2(competition_type, gender, age_group);
create index if not exists seasons_competition_current_idx on seasons(competition_id, current);
create index if not exists organizations_country_idx on organizations(country_id);
create index if not exists teams_v2_org_country_idx on teams_v2(organization_id, country_id);
create index if not exists teams_v2_type_idx on teams_v2(team_type, gender, age_group);
create index if not exists team_competitions_competition_idx on team_competitions(competition_id, season_id);
create index if not exists team_memberships_person_idx on team_memberships(person_id, season_id);
create index if not exists events_v2_competition_starts_idx on events_v2(competition_id, starts_at desc);
create index if not exists events_v2_status_starts_idx on events_v2(status, starts_at);
create index if not exists events_v2_teams_starts_idx on events_v2(home_team_id, away_team_id, starts_at desc);
create index if not exists competition_standings_lookup_idx on competition_standings(competition_id, season_id, position);

insert into sports (id, name, slug, description) values
('football','Football','football','Global football catalogue, competitions, teams, players and events.'),
('basketball','Basketball','basketball','Basketball catalogue foundation.'),
('tennis','Tennis','tennis','Tennis catalogue foundation.'),
('running','Running','running','Running catalogue foundation.')
on conflict (id) do update set name=excluded.name, description=excluded.description, updated_at=now();
