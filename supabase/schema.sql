create extension if not exists pgcrypto;

create table if not exists competitions (
  id text primary key,
  name text not null,
  slug text not null unique,
  sport text not null default 'football',
  country text,
  emblem_url text,
  provider text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists teams (
  id text primary key,
  name text not null,
  slug text not null unique,
  sport text not null default 'football',
  crest_url text,
  country text,
  competition_id text references competitions(id) on delete set null,
  provider text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists persons (
  id text primary key,
  name text not null,
  slug text not null unique,
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

create table if not exists events (
  id text primary key,
  sport text not null default 'football',
  competition_id text references competitions(id) on delete set null,
  home_team_id text references teams(id) on delete set null,
  away_team_id text references teams(id) on delete set null,
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

create index if not exists teams_competition_id_idx on teams(competition_id);
create index if not exists events_competition_kickoff_idx on events(competition_id, kickoff_at desc);
create index if not exists events_teams_kickoff_idx on events(home_team_id, away_team_id, kickoff_at desc);
create index if not exists articles_status_published_idx on articles(status, published_at desc);
