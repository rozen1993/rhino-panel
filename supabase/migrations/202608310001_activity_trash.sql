begin;

create index activities_trashed_idx
  on public.activities (deleted_at desc, id)
  where deleted_at is not null;

create function public.soft_delete_activity_v1(
  p_activity_id uuid,
  p_expected_version integer,
  p_reason text
)
returns table (
  activity_id uuid,
  activity_version integer,
  deleted_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  administrator public.profiles%rowtype;
  activity public.activities%rowtype;
  normalized_reason text := btrim(coalesce(p_reason, ''));
  deletion_moment timestamptz;
  next_version integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sistema-r-account-administration', 0)
  );
  -- Authorization is revalidated after waiting for account administration.
  administrator := private.require_admin_profile();

  if char_length(normalized_reason) not between 2 and 1000 then
    raise exception using errcode = 'SR003', message = 'invalid deletion reason';
  end if;

  select candidate.* into activity
  from public.activities candidate
  where candidate.id = p_activity_id
  for update;

  if not found then
    raise exception using errcode = 'SR002', message = 'activity not editable';
  end if;
  if activity.deleted_at is not null then
    raise exception using
      errcode = 'SR010',
      message = 'activity is already in the trash';
  end if;
  if p_expected_version is null or activity.version <> p_expected_version then
    raise exception using errcode = 'SR001', message = 'version conflict';
  end if;

  deletion_moment := now();
  next_version := activity.version + 1;
  update public.activities target
  set deleted_at = deletion_moment,
      deleted_by = administrator.id,
      deletion_reason = normalized_reason,
      version = next_version,
      updated_at = deletion_moment
  where target.id = activity.id;

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action, detail
  ) values (
    activity.id, administrator.id, administrator.display_name,
    administrator.role, 'Actividad dada de baja',
    pg_catalog.jsonb_build_object(
      'motivo', normalized_reason,
      'estado', activity.status,
      'responsable_id', activity.responsible_id
    )
  );

  return query select activity.id, next_version, deletion_moment;
end;
$$;

create function public.restore_activity_v1(
  p_activity_id uuid,
  p_expected_version integer,
  p_responsible_id uuid default null
)
returns table (
  activity_id uuid,
  activity_version integer,
  responsible_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  administrator public.profiles%rowtype;
  activity public.activities%rowtype;
  responsible public.profiles%rowtype;
  resolved_responsible_id uuid;
  responsible_changed boolean;
  next_version integer;
begin
  -- Keep the same global lock and lock order used by account administration.
  -- It serializes restoration against role changes, deactivation and Burson
  -- link transfers before this function locks the activity row.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sistema-r-account-administration', 0)
  );
  administrator := private.require_admin_profile();

  select candidate.* into activity
  from public.activities candidate
  where candidate.id = p_activity_id
  for update;

  if not found then
    raise exception using errcode = 'SR002', message = 'activity not restorable';
  end if;
  if activity.deleted_at is null then
    raise exception using
      errcode = 'SR010',
      message = 'activity is not in the trash';
  end if;
  if p_expected_version is null or activity.version <> p_expected_version then
    raise exception using errcode = 'SR001', message = 'version conflict';
  end if;

  resolved_responsible_id := coalesce(
    p_responsible_id,
    activity.responsible_id
  );
  responsible_changed := resolved_responsible_id is distinct from
    activity.responsible_id;

  if activity.status = 'Entregada' and responsible_changed then
    raise exception using
      errcode = 'SR009',
      message = 'delivered activity keeps its historical responsible';
  end if;

  -- Open work must return to an active operator. Delivered work may keep an
  -- inactive historical responsible, matching update_account_v1, which only
  -- blocks deactivation while non-delivered activities remain active.
  if activity.status <> 'Entregada' then
    if p_responsible_id is null and not exists (
      select 1
      from public.profiles candidate
      where candidate.id = activity.responsible_id
        and candidate.is_active
        and candidate.role = 'operario'
    ) then
      raise exception using
        errcode = 'SR009',
        message = 'restore requires an active responsible';
    end if;
    responsible := private.require_assignable_operator(resolved_responsible_id);
  else
    select candidate.* into responsible
    from public.profiles candidate
    where candidate.id = activity.responsible_id;
  end if;

  if activity.origin = 'burson'
    and activity.status <> 'Entregada'
    and not responsible.is_burson_operator then
    raise exception using
      errcode = 'SR003',
      message = 'Burson activity requires the linked operator';
  end if;
  next_version := activity.version + 1;
  update public.activities target
  set deleted_at = null,
      deleted_by = null,
      deletion_reason = null,
      responsible_id = resolved_responsible_id,
      responsible_name = case
        when responsible_changed then responsible.display_name
        else activity.responsible_name
      end,
      version = next_version,
      updated_at = now()
  where target.id = activity.id;

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action, detail
  ) values (
    activity.id, administrator.id, administrator.display_name,
    administrator.role, 'Actividad restaurada',
    pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
      'baja_original_en', activity.deleted_at,
      'baja_por', activity.deleted_by,
      'responsable_anterior_id', case
        when responsible_changed then activity.responsible_id
        else null
      end,
      'responsable_id', case
        when responsible_changed then resolved_responsible_id
        else null
      end,
      'responsable', case
        when not responsible_changed then null
        else responsible.display_name
      end
    ))
  );

  return query select activity.id, next_version, resolved_responsible_id;
end;
$$;

revoke all on function public.soft_delete_activity_v1(uuid, integer, text)
  from public, anon, authenticated, service_role;
revoke all on function public.restore_activity_v1(uuid, integer, uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.soft_delete_activity_v1(uuid, integer, text)
  to authenticated;
grant execute on function public.restore_activity_v1(uuid, integer, uuid)
  to authenticated;

comment on function public.soft_delete_activity_v1(uuid, integer, text) is
  'Admin-only reversible logical deletion with optimistic concurrency and atomic audit.';
comment on function public.restore_activity_v1(uuid, integer, uuid) is
  'Admin-only restoration that preserves activity history and revalidates open-work ownership.';

commit;
