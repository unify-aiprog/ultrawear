-- UltraWear FC constitutional platform persistence
-- Run after catalogue-schema-v2.sql.

create table if not exists sports_source_observations (
  id text primary key, source_id text not null, source_type text not null check (source_type in ('official','secondary','community','editorial')), entity_type text not null, entity_id text not null, observed_at timestamptz not null, freshness_at timestamptz,
  verification text not null check (verification in ('verified','unverified','conflicted','stale')), confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1), payload jsonb not null, content_hash text, created_at timestamptz not null default now()
);
create unique index if not exists sports_source_observations_hash_uidx on sports_source_observations(source_id, content_hash) where content_hash is not null;
create index if not exists sports_source_observations_entity_idx on sports_source_observations(entity_type, entity_id, observed_at desc);
create index if not exists sports_source_observations_freshness_idx on sports_source_observations(freshness_at);
create table if not exists sports_reconciliation_runs (
  id bigserial primary key, entity_type text not null, entity_id text not null, status text not null check (status in ('verified','conflicted','insufficient_evidence')), winner_observation_id text references sports_source_observations(id) on delete set null, observation_ids jsonb not null default '[]'::jsonb, conflict_ids jsonb not null default '[]'::jsonb, checked_at timestamptz not null default now()
);
create index if not exists sports_reconciliation_entity_idx on sports_reconciliation_runs(entity_type, entity_id, checked_at desc);
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

-- Platform persistence is trusted server data. RLS is enabled so the anon/authenticated roles
-- cannot read or mutate editorial, provenance, trend, or moderation records accidentally.
-- The service-role client used by trusted server jobs bypasses RLS as intended.
do $$ declare table_name text; begin
  foreach table_name in array array['sports_source_observations','sports_reconciliation_runs','content_stories','content_audit_log','content_claims','trend_signals','editorial_opportunities','community_submissions','community_moderation_audit'] loop
    execute format('alter table %I enable row level security', table_name);
  end loop;
end $$;
