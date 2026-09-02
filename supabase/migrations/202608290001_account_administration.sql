begin;

alter table public.profiles
  add constraint profiles_burson_operator_active check (
    not is_burson_operator or is_active
  );

revoke all on table public.audit_events from service_role;
revoke all on table public.account_audit_events from service_role;

create unique index profiles_one_active_burson
  on public.profiles ((true))
  where is_active and role = 'burson';

create function private.require_service_admin(actor_profile_id uuid)
returns public.profiles
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  administrator public.profiles%rowtype;
begin
  select candidate.* into administrator
  from public.profiles candidate
  where candidate.id = actor_profile_id
    and candidate.is_active
    and candidate.role = 'admin'
    and not candidate.must_change_password
  for share;

  if not found then
    raise exception using
      errcode = 'SR002',
      message = 'active administrator required';
  end if;

  return administrator;
end;
$$;

create function private.reassign_open_burson_activities(
  previous_operator_id uuid,
  next_operator public.profiles,
  administrator public.profiles
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  moved_count integer;
begin
  if previous_operator_id is null
    or previous_operator_id = next_operator.id then
    return 0;
  end if;

  with moved as (
    update public.activities activity
    set responsible_id = next_operator.id,
        responsible_name = next_operator.display_name,
        version = activity.version + 1,
        updated_at = now()
    where activity.origin = 'burson'
      and activity.responsible_id = previous_operator_id
      and activity.status <> 'Entregada'
      and activity.deleted_at is null
    returning activity.id
  ), audited as (
    insert into public.audit_events (
      activity_id, actor_id, actor_name, actor_role, action, detail
    )
    select
      moved.id,
      administrator.id,
      administrator.display_name,
      administrator.role,
      'Responsable Burson reasignado',
      pg_catalog.jsonb_build_object(
        'responsable_anterior_id', previous_operator_id,
        'responsable_id', next_operator.id,
        'responsable', next_operator.display_name
      )
    from moved
    returning id
  )
  select count(*)::integer into moved_count from audited;

  return moved_count;
end;
$$;

create function public.create_account_profile_v1(
  p_profile_id uuid,
  p_username text,
  p_display_name text,
  p_role public.app_role,
  p_is_burson_operator boolean,
  p_can_create_own_activities boolean,
  p_actor_id uuid
)
returns table (profile_id uuid, profile_updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  administrator public.profiles%rowtype;
  created_profile public.profiles%rowtype;
  previous_special public.profiles%rowtype;
  normalized_username text := lower(btrim(coalesce(p_username, '')));
  normalized_name text := btrim(coalesce(p_display_name, ''));
  transferred_count integer := 0;
begin
  -- Global order: advisory lock, actor profile, target profiles, activities.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sistema-r-account-administration', 0)
  );
  administrator := private.require_service_admin(p_actor_id);

  if p_profile_id is null
    or p_role is null
    or p_is_burson_operator is null
    or p_can_create_own_activities is null
    or normalized_username !~
      '^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$'
    or char_length(normalized_name) not between 2 and 120
    or (p_role <> 'operario' and p_is_burson_operator)
    or (p_role <> 'operario' and p_can_create_own_activities) then
    raise exception using errcode = 'SR003', message = 'invalid account data';
  end if;

  if exists (
    select 1 from public.profiles profile
    where profile.id = p_profile_id or profile.username = normalized_username
  ) then
    raise exception using errcode = 'SR006', message = 'account already exists';
  end if;

  if p_role = 'burson' and exists (
    select 1 from public.profiles profile
    where profile.is_active and profile.role = 'burson'
  ) then
    raise exception using
      errcode = 'SR009',
      message = 'only one active Burson account is allowed';
  end if;

  if p_is_burson_operator then
    select candidate.* into previous_special
    from public.profiles candidate
    where candidate.is_active
      and candidate.role = 'operario'
      and candidate.is_burson_operator
    for update;

    if previous_special.id is not null then
      update public.profiles profile
      set is_burson_operator = false,
          updated_at = now()
      where profile.id = previous_special.id;
    end if;
  end if;

  insert into public.profiles (
    id, username, display_name, role, is_active, is_burson_operator,
    can_create_own_activities, must_change_password
  ) values (
    p_profile_id, normalized_username, normalized_name, p_role, true,
    p_is_burson_operator, p_can_create_own_activities, true
  ) returning * into created_profile;

  if previous_special.id is not null then
    transferred_count := private.reassign_open_burson_activities(
      previous_special.id,
      created_profile,
      administrator
    );
    insert into public.account_audit_events (
      target_profile_id, actor_id, actor_name, action, detail
    ) values (
      previous_special.id,
      administrator.id,
      administrator.display_name,
      'Vínculo Burson transferido',
      pg_catalog.jsonb_build_object('to_profile_id', created_profile.id)
    );
  end if;

  insert into public.account_audit_events (
    target_profile_id, actor_id, actor_name, action, detail
  ) values (
    created_profile.id,
    administrator.id,
    administrator.display_name,
    'Cuenta creada con clave temporal',
    pg_catalog.jsonb_build_object(
      'role', created_profile.role,
      'can_create_own_activities', created_profile.can_create_own_activities,
      'is_burson_operator', created_profile.is_burson_operator,
      'burson_activities_transferred', transferred_count
    )
  );

  return query select created_profile.id, created_profile.updated_at;
end;
$$;

create function public.update_account_v1(
  p_profile_id uuid,
  p_expected_updated_at timestamptz,
  p_display_name text,
  p_role public.app_role,
  p_is_active boolean,
  p_is_burson_operator boolean,
  p_can_create_own_activities boolean
)
returns table (profile_id uuid, profile_updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  administrator public.profiles%rowtype;
  previous_profile public.profiles%rowtype;
  updated_profile public.profiles%rowtype;
  previous_special public.profiles%rowtype;
  normalized_name text := btrim(coalesce(p_display_name, ''));
  transferred_count integer := 0;
begin
  -- Acquire the global lock before any profile row lock to avoid lock inversion
  -- when two administrators edit each other concurrently.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sistema-r-account-administration', 0)
  );
  administrator := private.require_admin_profile();

  if p_profile_id is null
    or p_expected_updated_at is null
    or p_role is null
    or p_is_active is null
    or p_is_burson_operator is null
    or p_can_create_own_activities is null
    or char_length(normalized_name) not between 2 and 120
    or (p_role <> 'operario' and p_is_burson_operator)
    or (p_role <> 'operario' and p_can_create_own_activities) then
    raise exception using errcode = 'SR003', message = 'invalid account data';
  end if;

  select candidate.* into previous_profile
  from public.profiles candidate
  where candidate.id = p_profile_id
  for update;

  if not found then
    raise exception using errcode = 'SR003', message = 'account not found';
  end if;
  if previous_profile.updated_at <> p_expected_updated_at then
    raise exception using errcode = 'SR001', message = 'account version conflict';
  end if;

  if not p_is_active and p_is_burson_operator then
    raise exception using
      errcode = 'SR009',
      message = case
        when previous_profile.is_active
          and previous_profile.is_burson_operator
        then 'transfer the Burson link before changing this operator'
        else 'Burson link requires an active operator'
      end;
  end if;

  if not p_is_active
    and p_can_create_own_activities
    and not previous_profile.can_create_own_activities then
    raise exception using
      errcode = 'SR003',
      message = 'own creation permission requires an active operator';
  end if;

  if previous_profile.is_active
    and previous_profile.role = 'admin'
    and (not p_is_active or p_role <> 'admin')
    and (
      select count(*) from public.profiles profile
      where profile.is_active and profile.role = 'admin'
    ) = 1 then
    raise exception using errcode = 'SR009', message = 'last Admin must remain active';
  end if;

  if previous_profile.is_active
    and previous_profile.role = 'burson'
    and (not p_is_active or p_role <> 'burson')
    and (
      select count(*) from public.profiles profile
      where profile.is_active and profile.role = 'burson'
    ) = 1 then
    raise exception using
      errcode = 'SR009',
      message = 'active Burson account must remain';
  end if;

  if previous_profile.role = 'operario'
    and (
      p_role <> 'operario'
      or (previous_profile.is_active and not p_is_active)
    )
    and exists (
      select 1 from public.activities activity
      where activity.responsible_id = previous_profile.id
        and activity.deleted_at is null
        and activity.status <> 'Entregada'
    ) then
    raise exception using
      errcode = 'SR009',
      message = case
        when not p_is_active
        then 'reassign open activities before deactivating operator'
        else 'operator with open activities cannot change role'
      end;
  end if;

  if previous_profile.is_active
    and previous_profile.is_burson_operator
    and (
      not p_is_active
      or p_role <> 'operario'
      or not p_is_burson_operator
    ) then
    raise exception using
      errcode = 'SR009',
      message = 'transfer the Burson link before changing this operator';
  end if;

  if p_is_active and p_role = 'burson' and exists (
    select 1 from public.profiles profile
    where profile.id <> previous_profile.id
      and profile.is_active
      and profile.role = 'burson'
  ) then
    raise exception using
      errcode = 'SR009',
      message = 'only one active Burson account is allowed';
  end if;

  if p_is_active and p_is_burson_operator then
    select candidate.* into previous_special
    from public.profiles candidate
    where candidate.id <> previous_profile.id
      and candidate.is_active
      and candidate.role = 'operario'
      and candidate.is_burson_operator
    for update;

    if previous_special.id is not null then
      update public.profiles profile
      set is_burson_operator = false,
          updated_at = now()
      where profile.id = previous_special.id;
    end if;
  end if;

  update public.profiles profile
  set display_name = normalized_name,
      role = p_role,
      is_active = p_is_active,
      is_burson_operator = p_is_burson_operator,
      can_create_own_activities = case
        when p_is_active then p_can_create_own_activities
        else false
      end,
      updated_at = now()
  where profile.id = previous_profile.id
  returning * into updated_profile;

  if previous_special.id is not null then
    transferred_count := private.reassign_open_burson_activities(
      previous_special.id,
      updated_profile,
      administrator
    );
    insert into public.account_audit_events (
      target_profile_id, actor_id, actor_name, action, detail
    ) values (
      previous_special.id,
      administrator.id,
      administrator.display_name,
      'Vínculo Burson transferido',
      pg_catalog.jsonb_build_object('to_profile_id', updated_profile.id)
    );
  end if;

  if previous_profile.role <> updated_profile.role
    or previous_profile.is_active <> updated_profile.is_active then
    update public.app_sessions session
    set revoked_at = coalesce(session.revoked_at, now())
    where session.user_id = updated_profile.id
      and session.revoked_at is null;
  end if;

  insert into public.account_audit_events (
    target_profile_id, actor_id, actor_name, action, detail
  ) values (
    updated_profile.id,
    administrator.id,
    administrator.display_name,
    case
      when previous_profile.can_create_own_activities is distinct from
        updated_profile.can_create_own_activities
      then case when updated_profile.can_create_own_activities
        then 'Permiso de creación propia concedido'
        else 'Permiso de creación propia retirado'
      end
      when previous_profile.is_active is distinct from updated_profile.is_active
      then case when updated_profile.is_active
        then 'Cuenta reactivada'
        else 'Cuenta desactivada'
      end
      else 'Cuenta actualizada'
    end,
    pg_catalog.jsonb_build_object(
      'previous_role', previous_profile.role,
      'role', updated_profile.role,
      'is_active', updated_profile.is_active,
      'can_create_own_activities', updated_profile.can_create_own_activities,
      'is_burson_operator', updated_profile.is_burson_operator,
      'burson_activities_transferred', transferred_count
    )
  );

  return query select updated_profile.id, updated_profile.updated_at;
end;
$$;

create function public.prepare_temporary_password_reset_v1(
  p_profile_id uuid,
  p_actor_id uuid
)
returns table (profile_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  administrator public.profiles%rowtype;
  target public.profiles%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sistema-r-account-administration', 0)
  );
  administrator := private.require_service_admin(p_actor_id);

  select candidate.* into target
  from public.profiles candidate
  where candidate.id = p_profile_id
    and candidate.is_active
  for update;

  if not found then
    raise exception using errcode = 'SR003', message = 'account not found';
  end if;

  update public.profiles profile
  set must_change_password = true,
      updated_at = now()
  where profile.id = target.id;

  update public.app_sessions session
  set revoked_at = coalesce(session.revoked_at, now())
  where session.user_id = target.id
    and session.revoked_at is null;

  insert into public.account_audit_events (
    target_profile_id, actor_id, actor_name, action
  ) values (
    target.id,
    administrator.id,
    administrator.display_name,
    'Rotación de clave temporal iniciada; sesiones revocadas'
  );

  return query select target.id;
end;
$$;

create function public.confirm_temporary_password_reset_v1(
  p_profile_id uuid,
  p_actor_id uuid
)
returns table (profile_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  administrator public.profiles%rowtype;
  target public.profiles%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sistema-r-account-administration', 0)
  );
  administrator := private.require_service_admin(p_actor_id);

  select candidate.* into target
  from public.profiles candidate
  where candidate.id = p_profile_id
    and candidate.is_active
    and candidate.must_change_password
  for update;

  if not found then
    raise exception using
      errcode = 'SR002',
      message = 'temporary password reset is not pending';
  end if;

  insert into public.account_audit_events (
    target_profile_id, actor_id, actor_name, action
  ) values (
    target.id,
    administrator.id,
    administrator.display_name,
    'Clave temporal regenerada por Admin'
  );

  return query select target.id;
end;
$$;

create function public.complete_temporary_password_change_v1(
  p_profile_id uuid
)
returns table (profile_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.profiles%rowtype;
begin
  select candidate.* into target
  from public.profiles candidate
  where candidate.id = p_profile_id
    and candidate.is_active
  for update;

  if not found or not target.must_change_password then
    raise exception using
      errcode = 'SR002',
      message = 'temporary password change is not pending';
  end if;

  update public.profiles profile
  set must_change_password = false,
      updated_at = now()
  where profile.id = target.id;

  update public.app_sessions session
  set revoked_at = coalesce(session.revoked_at, now())
  where session.user_id = target.id
    and session.revoked_at is null;

  insert into public.account_audit_events (
    target_profile_id, actor_id, actor_name, action
  ) values (
    target.id,
    target.id,
    target.display_name,
    'Clave temporal reemplazada por el usuario'
  );

  return query select target.id;
end;
$$;

revoke all on function private.require_service_admin(uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.reassign_open_burson_activities(
  uuid, public.profiles, public.profiles
) from public, anon, authenticated, service_role;

revoke all on function public.create_account_profile_v1(
  uuid, text, text, public.app_role, boolean, boolean, uuid
) from public, anon, authenticated, service_role;
revoke all on function public.update_account_v1(
  uuid, timestamptz, text, public.app_role, boolean, boolean, boolean
) from public, anon, authenticated, service_role;
revoke all on function public.prepare_temporary_password_reset_v1(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.confirm_temporary_password_reset_v1(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.complete_temporary_password_change_v1(uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.create_account_profile_v1(
  uuid, text, text, public.app_role, boolean, boolean, uuid
) to service_role;
grant execute on function public.update_account_v1(
  uuid, timestamptz, text, public.app_role, boolean, boolean, boolean
) to authenticated;
grant execute on function public.prepare_temporary_password_reset_v1(uuid, uuid)
  to service_role;
grant execute on function public.confirm_temporary_password_reset_v1(uuid, uuid)
  to service_role;
grant execute on function public.complete_temporary_password_change_v1(uuid)
  to service_role;

comment on function public.create_account_profile_v1(
  uuid, text, text, public.app_role, boolean, boolean, uuid
) is 'Completa atómicamente el perfil después de crear el usuario en Auth.';
comment on function public.prepare_temporary_password_reset_v1(uuid, uuid)
  is 'Bloquea el negocio y revoca sesiones antes de regenerar una clave en Auth.';
comment on function public.confirm_temporary_password_reset_v1(uuid, uuid)
  is 'Registra la regeneración solo después de que Auth aceptó la clave temporal.';
comment on function public.complete_temporary_password_change_v1(uuid)
  is 'Limpia el bloqueo solo después de que Auth aceptó la nueva clave.';

commit;
