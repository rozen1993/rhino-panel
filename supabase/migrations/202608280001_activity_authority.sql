begin;

alter table public.profiles
  add column can_create_own_activities boolean not null default false,
  add column must_change_password boolean not null default false;

alter table public.profiles
  add constraint profiles_own_creation_role check (
    not can_create_own_activities or (role = 'operario' and is_active)
  );

alter table public.activity_date_spans
  add constraint activity_date_spans_historical_floor check (
    start_date >= date '2026-01-01'
  );

alter table public.activities
  drop constraint activities_origin_creator_role;

alter table public.activities
  add constraint activities_origin_creator_role check (
    (
      origin = 'operario'
      and created_by_role in ('operario', 'admin')
    )
    or (origin = 'burson' and created_by_role = 'burson')
  );

create table public.account_audit_events (
  id bigint generated always as identity primary key,
  target_profile_id uuid not null references public.profiles(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  actor_name text not null,
  action text not null check (char_length(btrim(action)) between 2 and 180),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index account_audit_events_target_idx
  on public.account_audit_events (target_profile_id, created_at desc);

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role
  from public.profiles profile
  where profile.id = auth.uid()
    and profile.is_active
    and not profile.must_change_password
    and private.has_active_app_session();
$$;

create or replace function private.can_view_activity(
  activity_origin public.activity_origin,
  activity_created_by uuid,
  activity_responsible_id uuid,
  activity_deleted_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not private.has_active_app_session() then false
    when private.current_app_role() = 'admin' then true
    when activity_deleted_at is not null then false
    when private.current_app_role() = 'operario' then
      activity_responsible_id = auth.uid()
    when private.current_app_role() = 'burson' then
      activity_origin = 'burson' and activity_created_by = auth.uid()
    else false
  end;
$$;

create function private.require_active_profile(
  required_role public.app_role default null
)
returns public.profiles
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  profile public.profiles%rowtype;
begin
  if not private.has_active_app_session() then
    raise exception using
      errcode = 'SR002',
      message = 'active app session required';
  end if;

  select candidate.* into profile
  from public.profiles candidate
  where candidate.id = auth.uid()
    and candidate.is_active
    and not candidate.must_change_password
  for share;

  if not found
    or (required_role is not null and profile.role <> required_role) then
    raise exception using
      errcode = 'SR002',
      message = 'role is not authorized';
  end if;

  return profile;
end;
$$;

create or replace function private.require_operator_profile()
returns public.profiles
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  return private.require_active_profile('operario');
end;
$$;

create function private.require_admin_profile()
returns public.profiles
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  return private.require_active_profile('admin');
end;
$$;

create function private.require_assignable_operator(target_id uuid)
returns public.profiles
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  profile public.profiles%rowtype;
begin
  select candidate.* into profile
  from public.profiles candidate
  where candidate.id = target_id
    and candidate.is_active
    and candidate.role = 'operario'
  for share;

  if not found then
    raise exception using
      errcode = 'SR003',
      message = 'responsible operator is not assignable';
  end if;

  return profile;
end;
$$;

create function private.replace_activity_spans(
  target_activity_id uuid,
  payload_spans jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.activity_date_spans span
  where span.activity_id = target_activity_id;

  insert into public.activity_date_spans (
    activity_id, position, start_date, end_date
  )
  select
    target_activity_id,
    entry.position::smallint,
    (span ->> 'start')::date,
    (span ->> 'end')::date
  from pg_catalog.jsonb_array_elements(payload_spans)
    with ordinality as entry(span, position);
end;
$$;

alter table public.account_audit_events enable row level security;

create policy account_audit_events_select_admin
on public.account_audit_events
for select
to authenticated
using (
  private.has_active_app_session()
  and private.current_app_role() = 'admin'
);

revoke all on table public.account_audit_events from anon, authenticated;
grant select on public.account_audit_events to authenticated;

revoke all on function public.create_activity_v1(
  uuid, public.activity_type, text, text, text, jsonb, text, text
) from public, anon, authenticated;
revoke all on function public.edit_activity_v1(
  uuid, integer, public.activity_type, text, text, text, jsonb, text, text
) from public, anon, authenticated;

drop function public.create_activity_v1(
  uuid, public.activity_type, text, text, text, jsonb, text, text
);
drop function public.edit_activity_v1(
  uuid, integer, public.activity_type, text, text, text, jsonb, text, text
);

create function public.plan_activity_v1(
  p_idempotency_key uuid,
  p_responsible_id uuid,
  p_type public.activity_type,
  p_title text,
  p_description text,
  p_place text,
  p_spans jsonb
)
returns table (activity_id uuid, activity_version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  administrator public.profiles%rowtype := private.require_admin_profile();
  responsible public.profiles%rowtype :=
    private.require_assignable_operator(p_responsible_id);
  new_activity_id uuid;
  new_version integer;
  request_hash text;
  replay_matches boolean;
  responsible_matches boolean;
  was_replayed boolean := false;
begin
  perform private.assert_activity_payload(p_title, p_description, p_spans, '');
  if p_idempotency_key is null
    or p_type is null
    or char_length(coalesce(p_place, '')) > 300 then
    raise exception using errcode = 'SR003', message = 'invalid activity data';
  end if;

  request_hash := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_object(
          'responsible_id', responsible.id,
          'type', p_type::text,
          'title', btrim(p_title),
          'description', btrim(p_description),
          'place', btrim(coalesce(p_place, '')),
          'spans', p_spans
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  begin
    insert into public.activities (
      origin, created_by, created_by_role, responsible_id, responsible_name,
      type, title, description, place, idempotency_key, idempotency_hash
    ) values (
      'operario', administrator.id, administrator.role,
      responsible.id, responsible.display_name, p_type, btrim(p_title),
      btrim(p_description), btrim(coalesce(p_place, '')),
      p_idempotency_key, request_hash
    ) returning id, version into new_activity_id, new_version;
  exception when unique_violation then
    select
      activity.id,
      activity.version,
      activity.deleted_at is null and activity.idempotency_hash = request_hash,
      activity.responsible_id = responsible.id
    into new_activity_id, new_version, replay_matches, responsible_matches
    from public.activities activity
    where activity.created_by = administrator.id
      and activity.idempotency_key = p_idempotency_key;

    if new_activity_id is null then raise; end if;
    if responsible_matches is distinct from true then
      raise exception using
        errcode = 'SR006',
        message = 'idempotent activity no longer matches its planned responsible';
    end if;
    if replay_matches is distinct from true then
      raise exception using
        errcode = 'SR006',
        message = 'idempotency key reused with a different request';
    end if;
    was_replayed := true;
  end;

  if not was_replayed then
    perform private.replace_activity_spans(new_activity_id, p_spans);
    insert into public.audit_events (
      activity_id, actor_id, actor_name, actor_role, action, detail
    ) values (
      new_activity_id, administrator.id, administrator.display_name,
      administrator.role, 'Actividad planificada',
      pg_catalog.jsonb_build_object(
        'responsable_id', responsible.id,
        'responsable', responsible.display_name
      )
    );
  end if;

  return query select new_activity_id, new_version, was_replayed;
end;
$$;

create function public.create_own_activity_v1(
  p_idempotency_key uuid,
  p_type public.activity_type,
  p_title text,
  p_description text,
  p_place text,
  p_spans jsonb
)
returns table (activity_id uuid, activity_version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  operator_profile public.profiles%rowtype := private.require_operator_profile();
  new_activity_id uuid;
  new_version integer;
  request_hash text;
  replay_matches boolean;
  responsible_matches boolean;
  was_replayed boolean := false;
begin
  if not operator_profile.can_create_own_activities then
    raise exception using
      errcode = 'SR002',
      message = 'operator does not have own creation permission';
  end if;

  perform private.assert_activity_payload(p_title, p_description, p_spans, '');
  if p_idempotency_key is null
    or p_type is null
    or char_length(coalesce(p_place, '')) > 300 then
    raise exception using errcode = 'SR003', message = 'invalid activity data';
  end if;

  request_hash := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_object(
          'responsible_id', operator_profile.id,
          'type', p_type::text,
          'title', btrim(p_title),
          'description', btrim(p_description),
          'place', btrim(coalesce(p_place, '')),
          'spans', p_spans
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  begin
    insert into public.activities (
      origin, created_by, created_by_role, responsible_id, responsible_name,
      type, title, description, place, idempotency_key, idempotency_hash
    ) values (
      'operario', operator_profile.id, operator_profile.role,
      operator_profile.id, operator_profile.display_name, p_type,
      btrim(p_title), btrim(p_description), btrim(coalesce(p_place, '')),
      p_idempotency_key, request_hash
    ) returning id, version into new_activity_id, new_version;
  exception when unique_violation then
    select
      activity.id,
      activity.version,
      activity.deleted_at is null and activity.idempotency_hash = request_hash,
      activity.responsible_id = operator_profile.id
    into new_activity_id, new_version, replay_matches, responsible_matches
    from public.activities activity
    where activity.created_by = operator_profile.id
      and activity.idempotency_key = p_idempotency_key;

    if new_activity_id is null then raise; end if;
    if responsible_matches is distinct from true then
      raise exception using
        errcode = 'SR006',
        message = 'idempotent activity no longer matches its responsible';
    end if;
    if replay_matches is distinct from true then
      raise exception using
        errcode = 'SR006',
        message = 'idempotency key reused with a different request';
    end if;
    was_replayed := true;
  end;

  if not was_replayed then
    perform private.replace_activity_spans(new_activity_id, p_spans);
    insert into public.audit_events (
      activity_id, actor_id, actor_name, actor_role, action
    ) values (
      new_activity_id, operator_profile.id, operator_profile.display_name,
      operator_profile.role, 'Actividad propia creada'
    );
  end if;

  return query select new_activity_id, new_version, was_replayed;
end;
$$;

create function public.replan_activity_v1(
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
language plpgsql
security definer
set search_path = ''
as $$
declare
  administrator public.profiles%rowtype := private.require_admin_profile();
  responsible public.profiles%rowtype :=
    private.require_assignable_operator(p_responsible_id);
  activity public.activities%rowtype;
  next_version integer;
begin
  perform private.assert_activity_payload(p_title, p_description, p_spans, '');
  if p_type is null or char_length(coalesce(p_place, '')) > 300 then
    raise exception using errcode = 'SR003', message = 'invalid activity data';
  end if;

  select candidate.* into activity
  from public.activities candidate
  where candidate.id = p_activity_id
  for update;

  if not found or activity.deleted_at is not null then
    raise exception using errcode = 'SR002', message = 'activity not editable';
  end if;
  if p_expected_version is null or activity.version <> p_expected_version then
    raise exception using errcode = 'SR001', message = 'version conflict';
  end if;
  if activity.origin = 'burson' and not responsible.is_burson_operator then
    raise exception using
      errcode = 'SR003',
      message = 'Burson activity requires the linked operator';
  end if;
  if activity.origin = 'burson'
    and activity.status = 'Entregada'
    and activity.responsible_id <> responsible.id then
    raise exception using
      errcode = 'SR009',
      message = 'delivered Burson activity keeps its historical responsible';
  end if;

  next_version := activity.version + 1;
  update public.activities target
  set responsible_id = responsible.id,
      responsible_name = responsible.display_name,
      type = p_type,
      title = btrim(p_title),
      description = btrim(p_description),
      place = btrim(coalesce(p_place, '')),
      version = next_version,
      updated_at = now()
  where target.id = activity.id;

  perform private.replace_activity_spans(activity.id, p_spans);

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action, detail
  ) values (
    activity.id, administrator.id, administrator.display_name,
    administrator.role, 'Planificación actualizada',
    pg_catalog.jsonb_build_object(
      'responsable_anterior_id', activity.responsible_id,
      'responsable_id', responsible.id,
      'responsable', responsible.display_name
    )
  );

  return query select activity.id, next_version;
end;
$$;

create function public.update_execution_v1(
  p_activity_id uuid,
  p_expected_version integer,
  p_material_link text,
  p_operator_opinion text
)
returns table (activity_id uuid, activity_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  operator_profile public.profiles%rowtype := private.require_operator_profile();
  activity public.activities%rowtype;
  next_version integer;
  normalized_material_link text := btrim(coalesce(p_material_link, ''));
  normalized_operator_opinion text := btrim(coalesce(p_operator_opinion, ''));
begin
  select candidate.* into activity
  from public.activities candidate
  where candidate.id = p_activity_id
  for update;

  if not found or activity.deleted_at is not null
    or activity.responsible_id <> operator_profile.id then
    raise exception using errcode = 'SR002', message = 'activity not executable';
  end if;
  if p_expected_version is null or activity.version <> p_expected_version then
    raise exception using errcode = 'SR001', message = 'version conflict';
  end if;
  if activity.thread_opened_at is not null then
    raise exception using
      errcode = 'SR007',
      message = 'execution fields are locked by the conversation';
  end if;
  if char_length(normalized_operator_opinion) > 5000
    or (
      normalized_material_link <> ''
      and not private.is_safe_https_url(normalized_material_link)
    ) then
    raise exception using errcode = 'SR003', message = 'invalid execution data';
  end if;
  if activity.status = 'Entregada' and normalized_material_link = '' then
    raise exception using
      errcode = 'SR005',
      message = 'delivered activity requires its material link';
  end if;

  next_version := activity.version + 1;
  update public.activities target
  set material_link = normalized_material_link,
      operator_opinion = normalized_operator_opinion,
      version = next_version,
      updated_at = now()
  where target.id = activity.id;

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action
  ) values (
    activity.id, operator_profile.id, operator_profile.display_name,
    operator_profile.role, 'Ejecución actualizada'
  );

  return query select activity.id, next_version;
end;
$$;

create or replace function public.advance_activity_v1(
  p_activity_id uuid,
  p_expected_version integer
)
returns table (
  activity_id uuid,
  activity_version integer,
  activity_status public.activity_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  operator_profile public.profiles%rowtype := private.require_operator_profile();
  activity public.activities%rowtype;
  next_status public.activity_status;
  next_version integer;
begin
  select candidate.* into activity
  from public.activities candidate
  where candidate.id = p_activity_id
  for update;

  if not found or activity.deleted_at is not null
    or activity.responsible_id <> operator_profile.id then
    raise exception using errcode = 'SR002', message = 'activity not executable';
  end if;
  if p_expected_version is null or activity.version <> p_expected_version then
    raise exception using errcode = 'SR001', message = 'version conflict';
  end if;

  if activity.status = 'Programada' then
    next_status := 'En proceso';
  elsif activity.status = 'En proceso' then
    if activity.material_link = ''
      or not private.is_safe_https_url(activity.material_link) then
      raise exception using errcode = 'SR005', message = 'material link required';
    end if;
    next_status := 'Entregada';
  else
    raise exception using errcode = 'SR004', message = 'invalid transition';
  end if;

  next_version := activity.version + 1;
  update public.activities target
  set status = next_status,
      delivered_at = case when next_status = 'Entregada' then now() else null end,
      version = next_version,
      updated_at = now()
  where target.id = activity.id;

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action, detail
  ) values (
    activity.id, operator_profile.id, operator_profile.display_name,
    operator_profile.role, 'Estado cambiado',
    pg_catalog.jsonb_build_object('estado', next_status)
  );

  return query select activity.id, next_version, next_status;
end;
$$;

create function public.set_operator_creation_permission_v1(
  p_operator_id uuid,
  p_enabled boolean
)
returns table (profile_id uuid, can_create_own_activities boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  administrator public.profiles%rowtype := private.require_admin_profile();
  operator_profile public.profiles%rowtype;
begin
  if p_enabled is null then
    raise exception using errcode = 'SR003', message = 'permission is required';
  end if;

  select candidate.* into operator_profile
  from public.profiles candidate
  where candidate.id = p_operator_id
    and candidate.role = 'operario'
    and (candidate.is_active or not p_enabled)
  for update;

  if not found then
    raise exception using errcode = 'SR003', message = 'operator not found';
  end if;

  if operator_profile.can_create_own_activities is distinct from p_enabled then
    update public.profiles target
    set can_create_own_activities = p_enabled,
        updated_at = now()
    where target.id = operator_profile.id;

    insert into public.account_audit_events (
      target_profile_id, actor_id, actor_name, action, detail
    ) values (
      operator_profile.id, administrator.id, administrator.display_name,
      case when p_enabled
        then 'Permiso de creación propia concedido'
        else 'Permiso de creación propia retirado'
      end,
      pg_catalog.jsonb_build_object('enabled', p_enabled)
    );
  end if;

  return query select operator_profile.id, p_enabled;
end;
$$;

revoke all on function private.require_active_profile(public.app_role)
  from public, anon, authenticated;
revoke all on function private.require_admin_profile()
  from public, anon, authenticated;
revoke all on function private.require_assignable_operator(uuid)
  from public, anon, authenticated;
revoke all on function private.replace_activity_spans(uuid, jsonb)
  from public, anon, authenticated;
revoke all on function private.require_operator_profile()
  from public, anon, authenticated;

revoke all on function public.plan_activity_v1(
  uuid, uuid, public.activity_type, text, text, text, jsonb
) from public, anon, authenticated;
revoke all on function public.create_own_activity_v1(
  uuid, public.activity_type, text, text, text, jsonb
) from public, anon, authenticated;
revoke all on function public.replan_activity_v1(
  uuid, integer, uuid, public.activity_type, text, text, text, jsonb
) from public, anon, authenticated;
revoke all on function public.update_execution_v1(uuid, integer, text, text)
  from public, anon, authenticated;
revoke all on function public.advance_activity_v1(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.set_operator_creation_permission_v1(uuid, boolean)
  from public, anon, authenticated;

grant execute on function public.plan_activity_v1(
  uuid, uuid, public.activity_type, text, text, text, jsonb
) to authenticated;
grant execute on function public.create_own_activity_v1(
  uuid, public.activity_type, text, text, text, jsonb
) to authenticated;
grant execute on function public.replan_activity_v1(
  uuid, integer, uuid, public.activity_type, text, text, text, jsonb
) to authenticated;
grant execute on function public.update_execution_v1(uuid, integer, text, text)
  to authenticated;
grant execute on function public.advance_activity_v1(uuid, integer)
  to authenticated;
grant execute on function public.set_operator_creation_permission_v1(uuid, boolean)
  to authenticated;

comment on column public.profiles.can_create_own_activities is
  'Permiso individual, revocable y false por defecto para crear una actividad propia.';
comment on column public.profiles.must_change_password is
  'Bloquea el acceso de negocio hasta completar el cambio de clave temporal.';
comment on table public.account_audit_events is
  'Auditoría administrativa separada porque audit_events exige activity_id.';

commit;
