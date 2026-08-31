-- UltraWear FC Sports Platform: canonical sports data model
-- Provider-neutral IDs are UUIDs; external provider IDs are retained for synchronization.

create extension if not exists pgcrypto;

create type public.content_status as enum ('draft','review','published','archived');
create type public.match_status as enum ('scheduled','live','halftime','finished','postponed','cancelled','suspended');
create type public.verification_status as enum ('unverified','verified','disputed','rejected');

create table public.sports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete restrict,
  slug text not null,
  name text not null,
  country text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sport_id, slug)
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete restrict,
  name text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (competition_id, name)
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  country text,
  capacity integer,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete restrict,
  slug text not null,
  name text not null,
  short_name text,
  country text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sport_id, slug)
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete restrict,
  slug text not null,
  name text not null,
  short_name text,
  nationality text,
  birth_date date,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sport_id, slug)
);

create table public.team_players (
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  shirt_number integer,
  position text,
  joined_at date,
  left_at date,
  primary key (team_id, player_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete restrict,
  competition_id uuid references public.competitions(id) on delete restrict,
  season_id uuid references public.seasons(id) on delete restrict,
  venue_id uuid references public.venues(id) on delete set null,
  home_team_id uuid references public.teams(id) on delete restrict,
  away_team_id uuid references public.teams(id) on delete restrict,
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  status public.match_status not null default 'scheduled',
  home_score integer,
  away_score integer,
  period text,
  minute integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_team_id is null or away_team_id is null or home_team_id <> away_team_id)
);

create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz,
  minute integer,
  team_id uuid references public.teams(id) on delete set null,
  player_id uuid references public.players(id) on delete set null,
  related_player_id uuid references public.players(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  source_id uuid,
  created_at timestamptz not null default now()
);

create table public.match_statistics (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  stat_key text not null,
  stat_value numeric,
  period text,
  source_id uuid,
  updated_at timestamptz not null default now()
);

create table public.standings (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  rank integer,
  played integer,
  wins integer,
  draws integer,
  losses integer,
  points numeric,
  scored integer,
  conceded integer,
  form text,
  updated_at timestamptz not null default now(),
  unique (season_id, team_id)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text,
  source_type text not null,
  source_url text,
  retrieved_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (provider, external_id)
);

create table public.external_ids (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  provider text not null,
  external_id text not null,
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (entity_type, provider, external_id)
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  content_type text not null,
  status public.content_status not null default 'draft',
  verification_status public.verification_status not null default 'unverified',
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  thumbnail_url text,
  media_type text not null,
  creator text,
  provider text,
  source_url text,
  license text,
  attribution text,
  rights_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index matches_scheduled_at_idx on public.matches (scheduled_at);
create index matches_status_idx on public.matches (status);
create index matches_competition_season_idx on public.matches (competition_id, season_id);
create index match_events_match_occurred_idx on public.match_events (match_id, occurred_at);
create index standings_competition_season_idx on public.standings (competition_id, season_id);
create index external_ids_lookup_idx on public.external_ids (entity_type, provider, external_id);
create index content_status_published_idx on public.content_items (status, published_at desc);

-- Provenance references are intentionally nullable because ingestion can stage data
-- before the provider source record is committed. A later migration may add strict
-- foreign keys once the ingestion transaction contract is finalized.
