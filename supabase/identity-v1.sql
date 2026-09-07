create table if not exists public.sports_identities (
  id text primary key,
  handle text not null unique,
  display_name text not null default 'New Fan',
  interests jsonb not null default '["football"]'::jsonb,
  followed_teams jsonb not null default '[]'::jsonb,
  followed_athletes jsonb not null default '[]'::jsonb,
  followed_communities jsonb not null default '[]'::jsonb,
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  badges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sports_identities_updated_idx on public.sports_identities(updated_at desc);

alter table public.sports_identities enable row level security;

do $$ begin
  create policy sports_identities_no_public_read on public.sports_identities for select using (false);
exception when duplicate_object then null;
end $$;
