create extension if not exists pgcrypto;

-- Core sports taxonomy. Keep entities provider-agnostic so the catalogue can grow beyond football.
create table if not exists sports (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists countries (
  id text primary key,
  name text not null,
  slug text not null unique,
  code text,
  flag_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists competitions (
  id text primary key,
  name text not null,
  slug text not null unique,
  sport_id text references sports(id) on delete set null,
  sport text not null default 'football',
  country_id text references countries(id) on delete set null,
  country text,
  level text,
  gender text not null default 'mixed',
  age_group text not null default 'senior',
  competition_type text not null default 'league',
  emblem_url text,
  provider text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists seasons (
  id text primary key,
  competition_id text references competitions(id) on delete cascade,
  name text not null,
  slug text not null,
  start_date date,
  end_date date,
  current boolean not null default false,
  provider text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competition_id, slug)
);

-- A club/organization is separate from a specific participating squad.
create table if not exists organizations (
  id text primary key,
  name text not null,
  slug text not null unique,
  sport_id text references sports(id) on delete set null,
  country_id text references countries(id) on delete set null,
  country text,
  crest_url text,
  organization_type text not null default 'club',
  provider text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists teams (
  id text primary key,
  organization_id text references organizations(id) on delete set null,
  name text not null,
  slug text not null unique,
  sport_id text references sports(id) on delete set null,
  sport text not null default 'football',
  crest_url text,
  country_id text references countries(id) on delete set null,
  country text,
  team_type text not null default 'club',
  gender text not null default 'men',
  age_group text not null default 'senior',
  parent_team_id text references teams(id) on delete set null,
  provider text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Many-to-many participation is essential: one team can play many competitions/seasons.
create table if not exists team_competitions (
  id uuid primary key default gen_random_uuid(),
  team_id text not null references teams(id) on delete cascade,
  competition_id text not null references competitions(id) on delete cascade,
  season_id text references seasons(id) on delete set null,
  role text not null default 'participant',
  created_at timestamptz not null default now(),
  unique (team_id, competition_id, season_id)
);

create table if not exists persons (
  id text primary key,
  name text not null,
  slug text not null unique,
  sport_id text references sports(id) on delete set null,
  sport text not null default 'football',
  image_url text,
  position text,
  nationality text,
  birth_date date,
  provider text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists team_memberships (
  id uuid primary key default gen_random_uuid(),
  team_id text not null references teams(id) on delete cascade,
  person_id text not null references persons(id) on delete cascade,
  season_id text references seasons(id) on delete set null,
  role text not null default 'player',
  shirt_number integer,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  unique (team_id, person_id, season_id, role)
);

create table if not exists venues (
  id text primary key,
  name text not null,
  slug text not null unique,
  city text,
  country text,
  capacity integer,
  image_url text,
  provider text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists events (
  id text primary key,
  sport_id text references sports(id) on delete set null,
  sport text not null default 'football',
  competition_id text references competitions(id) on delete set null,
  season_id text references seasons(id) on delete set null,
  home_team_id text references teams(id) on delete set null,
  away_team_id text references teams(id) on delete set null,
  venue_id text references venues(id) on delete set null,
  kickoff_at timestamptz,
  status text,
  home_score integer,
  away_score integer,
  venue text,
  provider text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  category text,
  author_name text,
  hero_image_url text,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft','published'))
);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

create index if not exists competitions_sport_country_idx on competitions(sport_id, country_id);
create index if not exists competitions_filters_idx on competitions(sport, gender, age_group, competition_type);
create index if not exists seasons_competition_current_idx on seasons(competition_id, current);
create index if not exists organizations_country_idx on organizations(country_id);
create index if not exists teams_organization_idx on teams(organization_id);
create index if not exists teams_filters_idx on teams(sport_id, gender, age_group, team_type);
create index if not exists teams_parent_idx on teams(parent_team_id);
create index if not exists team_competitions_team_idx on team_competitions(team_id);
create index if not exists team_competitions_competition_idx on team_competitions(competition_id, season_id);
create index if not exists team_memberships_team_idx on team_memberships(team_id, season_id);
create index if not exists team_memberships_person_idx on team_memberships(person_id, season_id);
create index if not exists events_competition_kickoff_idx on events(competition_id, kickoff_at desc);
create index if not exists events_season_kickoff_idx on events(season_id, kickoff_at desc);
create index if not exists events_teams_kickoff_idx on events(home_team_id, away_team_id, kickoff_at desc);
create index if not exists articles_status_published_idx on articles(status, published_at desc);
