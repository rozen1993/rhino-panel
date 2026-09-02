begin;

create function public.create_burson_request_v1(
  p_idempotency_key uuid,
  p_type public.activity_type,
  p_title text,
  p_description text,
  p_place text,
  p_spans jsonb,
  p_reference_link text default ''
)
returns table (activity_id uuid, activity_version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  burson_profile public.profiles%rowtype;
  special_operator public.profiles%rowtype;
  existing_activity public.activities%rowtype;
  normalized_reference text := btrim(coalesce(p_reference_link, ''));
  new_activity_id uuid;
  new_version integer;
  request_hash text;
begin
  perform private.assert_activity_payload(p_title, p_description, p_spans, '');
  if p_idempotency_key is null
    or p_type is null
    or char_length(coalesce(p_place, '')) > 300
    or char_length(normalized_reference) > 2048
    or (
      normalized_reference <> ''
      and not private.is_safe_https_url(normalized_reference)
    ) then
    raise exception using errcode = 'SR003', message = 'invalid Burson request';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_spans) span
    where (span ->> 'start')::date < date '2026-01-01'
  ) then
    raise exception using errcode = 'SR003', message = 'date is before history floor';
  end if;

  request_hash := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_object(
          'type', p_type::text,
          'title', btrim(p_title),
          'description', btrim(p_description),
          'place', btrim(coalesce(p_place, '')),
          'spans', p_spans,
          'reference_link', normalized_reference
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  -- Account administration uses the same transaction lock. This makes
  -- resolving the special operator and inserting the request atomic with a
  -- concurrent transfer of the Burson link.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sistema-r-account-administration', 0)
  );
  burson_profile := private.require_active_profile('burson');

  -- A replay is independent of the current special operator. Open requests
  -- may have been reassigned legitimately after the original insert.
  select candidate.* into existing_activity
  from public.activities candidate
  where candidate.created_by = burson_profile.id
    and candidate.idempotency_key = p_idempotency_key
  for update;

  if found then
    if existing_activity.deleted_at is not null
      or existing_activity.origin <> 'burson'
      or existing_activity.created_by_role <> 'burson'
      or existing_activity.idempotency_hash <> request_hash then
      raise exception using
        errcode = 'SR006',
        message = 'idempotency key reused with a different Burson request';
    end if;

    return query
      select existing_activity.id, existing_activity.version, true;
    return;
  end if;

  select candidate.* into special_operator
  from public.profiles candidate
  where candidate.is_active
    and candidate.role = 'operario'
    and candidate.is_burson_operator
  for update;

  if not found then
    raise exception using
      errcode = 'SR009',
      message = 'active Burson operator is required';
  end if;

  insert into public.activities (
    origin, created_by, created_by_role, responsible_id, responsible_name,
    type, title, description, place, reference_link,
    idempotency_key, idempotency_hash
  ) values (
    'burson', burson_profile.id, burson_profile.role,
    special_operator.id, special_operator.display_name,
    p_type, btrim(p_title), btrim(p_description),
    btrim(coalesce(p_place, '')), normalized_reference,
    p_idempotency_key, request_hash
  ) returning id, version into new_activity_id, new_version;

  perform private.replace_activity_spans(new_activity_id, p_spans);

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action, detail
  ) values (
    new_activity_id, burson_profile.id, burson_profile.display_name,
    burson_profile.role, 'Encargo Burson creado y asignado',
    pg_catalog.jsonb_build_object(
      'responsable_id', special_operator.id,
      'responsable', special_operator.display_name
    )
  );

  return query select new_activity_id, new_version, false;
end;
$$;

revoke all on function public.create_burson_request_v1(
  uuid, public.activity_type, text, text, text, jsonb, text
) from public, anon, authenticated, service_role;

grant execute on function public.create_burson_request_v1(
  uuid, public.activity_type, text, text, text, jsonb, text
) to authenticated;

commit;
