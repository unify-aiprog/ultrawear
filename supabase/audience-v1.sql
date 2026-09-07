create table if not exists public.audience_events (
  id text primary key,
  name text not null check (name in ('page_view','live_view','participation','quest_accept','community_post','community_reaction','interest_toggle','follow_toggle')),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  anonymous_id text not null,
  properties jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists audience_events_occurred_at_idx on public.audience_events(occurred_at desc);
create index if not exists audience_events_anonymous_id_idx on public.audience_events(anonymous_id, occurred_at desc);
create index if not exists audience_events_name_idx on public.audience_events(name, occurred_at desc);

alter table public.audience_events enable row level security;

-- Audience events are write-only from the application service role. Public clients do not receive read access.
do $$ begin
  create policy audience_events_public_no_read on public.audience_events for select using (false);
exception when duplicate_object then null;
end $$;
