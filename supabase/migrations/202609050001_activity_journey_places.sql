begin;

-- Additive: the empty value inherits activities.place, including legacy rows.
alter table public.activity_date_spans
  add column place text not null default ''
  constraint activity_date_spans_place_length check (char_length(place) <= 300);

-- Pure payload helper; it has no table access or elevated privileges.
create function private.normalize_activity_spans_v2(payload_spans jsonb)
returns jsonb
language plpgsql immutable security invoker set search_path = ''
as $$
declare
  entry jsonb;
  normalized jsonb := '[]'::jsonb;
begin
  if payload_spans is null or jsonb_typeof(payload_spans) is distinct from 'array' then
    raise exception using errcode = 'SR003', message = 'spans must be an array';
  end if;
  if jsonb_array_length(payload_spans) not between 1 and 100 then
    raise exception using errcode = 'SR003', message = 'invalid span count';
  end if;
  for entry in select value from jsonb_array_elements(payload_spans) loop
    if jsonb_typeof(entry) is distinct from 'object'
      or jsonb_typeof(entry -> 'start') is distinct from 'string'
      or jsonb_typeof(entry -> 'end') is distinct from 'string'
      or (entry ? 'place' and jsonb_typeof(entry -> 'place') is distinct from 'string')
      or char_length(coalesce(entry ->> 'place', '')) > 300 then
      raise exception using errcode = 'SR003', message = 'invalid journey data';
    end if;
    normalized := normalized || jsonb_build_array(jsonb_build_object(
      'start', entry ->> 'start', 'end', entry ->> 'end',
      'place', btrim(coalesce(entry ->> 'place', ''))
    ));
  end loop;
  return normalized;
end;
$$;

create or replace function private.replace_activity_spans(
  target_activity_id uuid, payload_spans jsonb
)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  normalized jsonb;
  had_places boolean;
  declares_places boolean;
begin
  -- Same parent lock as replan_v1. All guard, replace, version and audit work
  -- occurs in the caller transaction; exceptions roll back the complete write.
  perform 1 from public.activities where id = target_activity_id for update;
  normalized := private.normalize_activity_spans_v2(payload_spans);
  select bool_and(span ? 'place') into declares_places
  from jsonb_array_elements(payload_spans) span;

  with removed as (
    delete from public.activity_date_spans
    where activity_id = target_activity_id returning place
  )
  select coalesce(bool_or(place <> ''), false) into had_places from removed;

  if had_places and not declares_places then
    raise exception using errcode = 'SR011',
      message = 'client upgrade required to preserve journey places';
  end if;

  insert into public.activity_date_spans (activity_id, position, start_date, end_date, place)
  select target_activity_id, entry.position::smallint,
    (span ->> 'start')::date, (span ->> 'end')::date, span ->> 'place'
  from jsonb_array_elements(normalized) with ordinality as entry(span, position);
end;
$$;

revoke all on function private.normalize_activity_spans_v2(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function private.normalize_activity_spans_v2(jsonb) to authenticated;
revoke all on function private.replace_activity_spans(uuid, jsonb)
  from public, anon, authenticated, service_role;

-- v1 bodies, fingerprints and authorities are unchanged. v2 canonicalizes ONLY
-- its own input. Reusing a v1 idempotency key via v2 fails closed with SR006.

create function public.plan_activity_v2(
  p_idempotency_key uuid,
  p_responsible_id uuid,
  p_type public.activity_type,
  p_title text,
  p_description text,
  p_place text,
  p_spans jsonb
)
returns table (activity_id uuid, activity_version integer, replayed boolean)
language sql security invoker set search_path = ''
as $$
  select * from public.plan_activity_v1(
    p_idempotency_key, p_responsible_id, p_type, p_title, p_description, p_place, private.normalize_activity_spans_v2(p_spans)
  );
$$;
revoke all on function public.plan_activity_v2(uuid, uuid, public.activity_type, text, text, text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.plan_activity_v2(uuid, uuid, public.activity_type, text, text, text, jsonb) to authenticated;

create function public.create_own_activity_v2(
  p_idempotency_key uuid,
  p_type public.activity_type,
  p_title text,
  p_description text,
  p_place text,
  p_spans jsonb
)
returns table (activity_id uuid, activity_version integer, replayed boolean)
language sql security invoker set search_path = ''
as $$
  select * from public.create_own_activity_v1(
    p_idempotency_key, p_type, p_title, p_description, p_place, private.normalize_activity_spans_v2(p_spans)
  );
$$;
revoke all on function public.create_own_activity_v2(uuid, public.activity_type, text, text, text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.create_own_activity_v2(uuid, public.activity_type, text, text, text, jsonb) to authenticated;

create function public.replan_activity_v2(
  p_activity_id uuid,
  p_expected_version integer,
  p_responsible_id uuid,
  p_type public.activity_type,
  p_title text,
  p_description text,
  p_place text,
  p_spans jsonb
)
returns table (activity_id uuid, activity_version integer)
language sql security invoker set search_path = ''
as $$
  select * from public.replan_activity_v1(
    p_activity_id, p_expected_version, p_responsible_id, p_type, p_title, p_description, p_place, private.normalize_activity_spans_v2(p_spans)
  );
$$;
revoke all on function public.replan_activity_v2(uuid, integer, uuid, public.activity_type, text, text, text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.replan_activity_v2(uuid, integer, uuid, public.activity_type, text, text, text, jsonb) to authenticated;

create function public.create_burson_request_v2(
  p_idempotency_key uuid,
  p_type public.activity_type,
  p_title text,
  p_description text,
  p_place text,
  p_spans jsonb,
  p_reference_link text default ''
)
returns table (activity_id uuid, activity_version integer, replayed boolean)
language sql security invoker set search_path = ''
as $$
  select * from public.create_burson_request_v1(
    p_idempotency_key, p_type, p_title, p_description, p_place, private.normalize_activity_spans_v2(p_spans), p_reference_link
  );
$$;
revoke all on function public.create_burson_request_v2(uuid, public.activity_type, text, text, text, jsonb, text)
  from public, anon, authenticated, service_role;
grant execute on function public.create_burson_request_v2(uuid, public.activity_type, text, text, text, jsonb, text) to authenticated;

commit;

