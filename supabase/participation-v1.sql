alter table public.sports_identities add column if not exists streak integer not null default 0 check (streak >= 0);
alter table public.sports_identities add column if not exists participations integer not null default 0 check (participations >= 0);
alter table public.sports_identities add column if not exists last_participation_at timestamptz;

create table if not exists public.participation_records (
  id text primary key,
  identity_id text not null references public.sports_identities(id) on delete cascade,
  event_id text not null,
  action_id text not null,
  kind text not null check (kind in ('prediction','poll','reaction','quest')),
  points integer not null check (points between 0 and 100),
  created_at timestamptz not null default now(),
  unique(identity_id, event_id, action_id)
);

create index if not exists participation_records_identity_idx on public.participation_records(identity_id, created_at desc);
create index if not exists participation_records_event_idx on public.participation_records(event_id, created_at desc);

alter table public.participation_records enable row level security;
do $$ begin
  create policy participation_records_no_public_read on public.participation_records for select using (false);
exception when duplicate_object then null;
end $$;
