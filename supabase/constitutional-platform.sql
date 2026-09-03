-- UltraWear FC constitutional platform persistence
-- Run after catalogue-schema-v2.sql.

create table if not exists sports_source_observations (
  id text primary key, source_id text not null, source_type text not null check (source_type in ('official','secondary','community','editorial')), entity_type text not null, entity_id text not null, observed_at timestamptz not null, freshness_at timestamptz,
  verification text not null check (verification in ('verified','unverified','conflicted','stale')), confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1), payload jsonb not null, content_hash text, created_at timestamptz not null default now()
);
drop index if exists sports_source_observations_hash_uidx;
create unique index if not exists sports_source_observations_hash_uidx on sports_source_observations(source_id, entity_type, entity_id, content_hash) where content_hash is not null;
create index if not exists sports_source_observations_entity_idx on sports_source_observations(entity_type, entity_id, observed_at desc);
create index if not exists sports_source_observations_freshness_idx on sports_source_observations(freshness_at);
create table if not exists sports_reconciliation_runs (
  id bigserial primary key, entity_type text not null, entity_id text not null, status text not null check (status in ('verified','conflicted','insufficient_evidence')), winner_observation_id text references sports_source_observations(id) on delete set null, observation_ids jsonb not null default '[]'::jsonb, conflict_ids jsonb not null default '[]'::jsonb, checked_at timestamptz not null default now()
);
create index if not exists sports_reconciliation_entity_idx on sports_reconciliation_runs(entity_type, entity_id, checked_at desc);
create table if not exists sports_entity_links (
  id bigserial primary key, entity_type text not null, canonical_entity_id text not null, provider text not null, provider_entity_id text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(entity_type, provider, provider_entity_id), unique(entity_type, canonical_entity_id, provider)
);
create index if not exists sports_entity_links_canonical_idx on sports_entity_links(entity_type, canonical_entity_id);
create table if not exists content_stories (
  id text primary key, type text not null, title text not null, canonical_slug text not null unique, summary text not null default '', state text not null, signal_ids jsonb not null default '[]'::jsonb, entities jsonb not null default '[]'::jsonb, evidence jsonb not null default '[]'::jsonb, author text, editor text, published_at timestamptz, updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create index if not exists content_stories_state_idx on content_stories(state, updated_at desc);
create index if not exists content_stories_published_idx on content_stories(published_at desc);
create table if not exists content_audit_log (
  id bigserial primary key, story_id text not null references content_stories(id) on delete cascade, action text not null, actor text not null, reason text not null default '', from_state text, to_state text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists content_audit_story_idx on content_audit_log(story_id, created_at desc);
create table if not exists content_claims (
  id text primary key, story_id text not null references content_stories(id) on delete cascade, claim_text text not null, evidence_ids jsonb not null default '[]'::jsonb, contradicted_by jsonb not null default '[]'::jsonb, verification_status text not null default 'unverified', confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1), checked_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists content_claims_story_idx on content_claims(story_id);
create table if not exists trend_signals (
  id text primary key, source_id text not null, source_type text not null check (source_type in ('official','secondary','community','editorial')), topic_key text not null, title text not null, observed_at timestamptz not null, location_scope text not null check (location_scope in ('near_you','country','region','global','personalized')), location_code text, velocity numeric not null default 0, confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1), relevance numeric not null default 0 check (relevance >= 0 and relevance <= 1), payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create unique index if not exists trend_signals_source_hash_uidx on trend_signals(source_id, topic_key, observed_at);
create index if not exists trend_signals_topic_idx on trend_signals(topic_key, observed_at desc);
create index if not exists trend_signals_location_idx on trend_signals(location_scope, location_code, observed_at desc);
create table if not exists editorial_opportunities (
  id text primary key, trend_signal_ids jsonb not null default '[]'::jsonb, title text not null, reason text not null, status text not null check (status in ('queued','researching','review','accepted','rejected','expired')), confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists editorial_opportunities_status_idx on editorial_opportunities(status, updated_at desc);
create table if not exists community_submissions (
  id text primary key, author_id text not null, body text not null, status text not null check (status in ('pending','approved','rejected','removed','appeal')), created_at timestamptz not null, moderated_at timestamptz, moderator_id text, reason text not null default ''
);
create index if not exists community_submissions_status_idx on community_submissions(status, created_at desc);
create table if not exists community_moderation_audit (
  id bigserial primary key, submission_id text not null references community_submissions(id) on delete cascade, from_status text not null, to_status text not null, moderator_id text not null, reason text not null default '', created_at timestamptz not null default now()
);
create index if not exists community_moderation_audit_submission_idx on community_moderation_audit(submission_id, created_at desc);

create or replace function moderate_community_submission(p_submission_id text, p_to_status text, p_moderator_id text, p_reason text default '') returns jsonb language plpgsql security definer set search_path = public as $$
declare current_row community_submissions%rowtype; updated_row community_submissions%rowtype; allowed boolean := false;
begin
  if nullif(trim(p_submission_id), '') is null or nullif(trim(p_moderator_id), '') is null then raise exception 'submission id and moderator id are required'; end if;
  select * into current_row from community_submissions where id = p_submission_id for update;
  if not found then raise exception 'submission not found'; end if;
  allowed := (current_row.status = 'pending' and p_to_status in ('approved','rejected')) or (current_row.status = 'approved' and p_to_status = 'removed') or (current_row.status in ('rejected','removed') and p_to_status = 'appeal') or (current_row.status = 'appeal' and p_to_status in ('approved','rejected'));
  if not allowed then raise exception 'invalid moderation transition: % -> %', current_row.status, p_to_status; end if;
  update community_submissions set status = p_to_status, moderated_at = now(), moderator_id = p_moderator_id, reason = coalesce(p_reason, '') where id = p_submission_id returning * into updated_row;
  insert into community_moderation_audit(submission_id, from_status, to_status, moderator_id, reason) values (p_submission_id, current_row.status, updated_row.status, p_moderator_id, coalesce(p_reason, ''));
  return to_jsonb(updated_row);
end; $$;

create or replace function transition_content_story(p_story_id text, p_to_state text, p_actor text, p_reason text default '', p_published_at timestamptz default null) returns jsonb language plpgsql security definer set search_path = public as $$
declare current_row content_stories%rowtype; updated_row content_stories%rowtype; allowed boolean := false; next_published_at timestamptz;
begin
  if nullif(trim(p_story_id), '') is null or nullif(trim(p_actor), '') is null then raise exception 'story id and actor are required'; end if;
  select * into current_row from content_stories where id = p_story_id for update;
  if not found then raise exception 'story not found'; end if;
  allowed := (current_row.state = 'opportunity' and p_to_state in ('researching','archived')) or (current_row.state = 'researching' and p_to_state in ('drafting','archived')) or (current_row.state = 'drafting' and p_to_state in ('verifying','archived')) or (current_row.state = 'verifying' and p_to_state in ('review','drafting','archived')) or (current_row.state = 'review' and p_to_state in ('approved','drafting','archived')) or (current_row.state = 'approved' and p_to_state in ('published','review')) or (current_row.state = 'published' and p_to_state in ('refresh_due','archived')) or (current_row.state = 'refresh_due' and p_to_state in ('researching','archived'));
  if not allowed then raise exception 'invalid content transition: % -> %', current_row.state, p_to_state; end if;
  next_published_at := case when p_to_state = 'published' then coalesce(current_row.published_at, p_published_at, now()) else current_row.published_at end;
  update content_stories set state = p_to_state, updated_at = now(), published_at = next_published_at where id = p_story_id returning * into updated_row;
  insert into content_audit_log(story_id, action, actor, reason, from_state, to_state, metadata) values (p_story_id, 'state_transition', p_actor, coalesce(p_reason, ''), current_row.state, updated_row.state, '{}'::jsonb);
  return to_jsonb(updated_row);
end; $$;

revoke all on function moderate_community_submission(text, text, text, text) from public, anon, authenticated;
grant execute on function moderate_community_submission(text, text, text, text) to service_role;
revoke all on function transition_content_story(text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function transition_content_story(text, text, text, text, timestamptz) to service_role;

do $$ declare table_name text; begin
  foreach table_name in array array['sports_source_observations','sports_reconciliation_runs','sports_entity_links','content_stories','content_audit_log','content_claims','trend_signals','editorial_opportunities','community_submissions','community_moderation_audit'] loop
    execute format('alter table %I enable row level security', table_name);
  end loop;
end $$;
