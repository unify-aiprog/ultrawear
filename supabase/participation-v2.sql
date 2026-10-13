-- Server-authoritative, idempotent participation awards.
-- XP, streak, participations and badges are applied here, never by the browser.
-- The participation_records unique(identity_id, event_id, action_id) constraint
-- combined with the ledger id in lib/participation/ledger.ts makes retries safe.

alter table public.participation_records add column if not exists applied boolean not null default false;

-- Defensive: guarantee the idempotency key even on databases created before v1.
create unique index if not exists participation_records_identity_event_action_uidx
  on public.participation_records(identity_id, event_id, action_id);

-- Apply a single participation exactly once. Concurrent or repeated calls for the
-- same record id return applied=false instead of double-counting progression.
create or replace function public.award_participation(p_record_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.participation_records;
  ident public.sports_identities;
  v_now_day date;
  v_last_day date;
  v_streak integer;
  v_participations integer;
  v_badges jsonb;
begin
  select * into rec from public.participation_records where id = p_record_id for update;
  if not found then
    raise exception 'participation record % not found', p_record_id;
  end if;

  if rec.applied then
    select * into ident from public.sports_identities where id = rec.identity_id;
    return to_jsonb(ident) || jsonb_build_object('applied', false);
  end if;

  select * into ident from public.sports_identities where id = rec.identity_id for update;
  if not found then
    raise exception 'identity % not found', rec.identity_id;
  end if;

  v_now_day := (now() at time zone 'utc')::date;
  v_last_day := (ident.last_participation_at at time zone 'utc')::date;
  if ident.last_participation_at is null then
    v_streak := 1;
  elsif v_now_day = v_last_day then
    v_streak := greatest(1, ident.streak);
  elsif v_now_day = v_last_day + 1 then
    v_streak := ident.streak + 1;
  else
    v_streak := 1;
  end if;

  v_participations := ident.participations + 1;
  v_badges := ident.badges;
  if v_participations >= 10 and not (v_badges ? 'IN THE MIX') then
    v_badges := v_badges || '"IN THE MIX"'::jsonb;
  end if;
  if v_streak >= 7 and not (v_badges ? 'SEVEN DAY SIGNAL') then
    v_badges := v_badges || '"SEVEN DAY SIGNAL"'::jsonb;
  end if;

  update public.sports_identities
  set xp = ident.xp + rec.points,
      level = floor((ident.xp + rec.points) / 100) + 1,
      streak = v_streak,
      participations = v_participations,
      last_participation_at = now(),
      badges = v_badges,
      updated_at = now()
  where id = ident.id
  returning * into ident;

  update public.participation_records set applied = true where id = p_record_id;

  return to_jsonb(ident) || jsonb_build_object('applied', true);
end;
$$;

revoke all on function public.award_participation(text) from public, anon, authenticated;
