create table if not exists public.sports_brain_events (
  id text primary key,
  sport text not null,
  starts_at timestamptz not null,
  status text not null,
  competition text not null,
  stage text,
  home jsonb,
  away jsonb,
  participants jsonb,
  home_score integer,
  away_score integer,
  provider text not null,
  provider_id text not null,
  updated_at timestamptz not null default now(),
  importance numeric not null default 0,
  priority text not null default 'BACKGROUND',
  unique(provider, provider_id)
);

create index if not exists sports_brain_events_sport_start_idx on public.sports_brain_events(sport, starts_at);
create index if not exists sports_brain_events_status_idx on public.sports_brain_events(status);

create table if not exists public.sports_brain_programme_state (
  id text primary key default 'global',
  lead_event_id text,
  live_event_ids jsonb not null default '[]'::jsonb,
  next_event_ids jsonb not null default '[]'::jsonb,
  tonight_event_ids jsonb not null default '[]'::jsonb,
  tomorrow_event_ids jsonb not null default '[]'::jsonb,
  weekend_event_ids jsonb not null default '[]'::jsonb,
  recent_event_ids jsonb not null default '[]'::jsonb,
  editorial_priority text,
  programme jsonb not null default '{}'::jsonb,
  source_health jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.sports_brain_provider_health (
  provider text primary key,
  sport text not null,
  status text not null,
  checked_at timestamptz not null default now(),
  last_success_at timestamptz,
  latency_ms integer,
  error text
);

alter table public.sports_brain_events enable row level security;
alter table public.sports_brain_programme_state enable row level security;
alter table public.sports_brain_provider_health enable row level security;

do $$ begin
  create policy sports_brain_events_public_read on public.sports_brain_events for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy sports_brain_programme_public_read on public.sports_brain_programme_state for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy sports_brain_health_public_read on public.sports_brain_provider_health for select using (true);
exception when duplicate_object then null;
end $$;
