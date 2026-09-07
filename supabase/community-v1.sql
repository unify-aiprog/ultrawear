create table if not exists public.community_posts (
  id text primary key,
  author_id text not null references public.sports_identities(id) on delete cascade,
  author_handle text not null,
  community text not null,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'published' check (status in ('published','hidden','removed')),
  reactions integer not null default 0 check (reactions >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_posts_feed_idx on public.community_posts(community, status, created_at desc);

create table if not exists public.community_comments (
  id text primary key,
  post_id text not null references public.community_posts(id) on delete cascade,
  author_id text not null references public.sports_identities(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'published' check (status in ('published','hidden','removed')),
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post_idx on public.community_comments(post_id, created_at);

create table if not exists public.community_reports (
  id text primary key,
  reporter_id text not null references public.sports_identities(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment')),
  target_id text not null,
  reason text not null check (reason in ('spam','harassment','hate','misinformation','other')),
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists community_reports_status_idx on public.community_reports(status, created_at desc);

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reports enable row level security;
do $$ begin create policy community_posts_no_public_read on public.community_posts for select using (false); exception when duplicate_object then null; end $$;
do $$ begin create policy community_comments_no_public_read on public.community_comments for select using (false); exception when duplicate_object then null; end $$;
do $$ begin create policy community_reports_no_public_read on public.community_reports for select using (false); exception when duplicate_object then null; end $$;
