begin;

create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('operario', 'admin', 'burson');
create type public.activity_status as enum ('Programada', 'En proceso', 'Entregada');
create type public.activity_type as enum ('Grabación', 'Edición', 'Creatividad', 'Locución');
create type public.activity_origin as enum ('operario', 'burson');

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter default privileges in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private
  revoke execute on functions from public, anon, authenticated;

create function private.is_safe_https_url(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    value = btrim(value)
    and value ~* '^https://[^/?#[:space:]@]+(?::[0-9]+)?(?:[/?#][^[:space:]]*)?$'
    and value !~* '^https://[^/?#[:space:]]+@';
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  username extensions.citext not null unique,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 120),
  role public.app_role not null,
  is_active boolean not null default true,
  is_burson_operator boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username::text ~ '^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$'
  ),
  constraint profiles_burson_operator_role check (
    not is_burson_operator or role = 'operario'
  )
);

create unique index profiles_one_active_burson_operator
  on public.profiles ((true))
  where is_active and role = 'operario' and is_burson_operator;

create index profiles_active_role_idx on public.profiles (is_active, role);

create table public.app_sessions (
  session_id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours'),
  revoked_at timestamptz,
  constraint app_sessions_window check (
    expires_at > started_at
    and expires_at <= started_at + interval '12 hours'
  )
);

create index app_sessions_user_active_idx
  on public.app_sessions (user_id, expires_at)
  where revoked_at is null;

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  origin public.activity_origin not null default 'operario',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_by_role public.app_role not null,
  responsible_id uuid not null references public.profiles(id) on delete restrict,
  responsible_name text not null check (char_length(btrim(responsible_name)) between 2 and 120),
  type public.activity_type not null,
  title text not null check (char_length(btrim(title)) between 2 and 180),
  description text not null check (char_length(btrim(description)) between 2 and 5000),
  place text not null default '' check (char_length(place) <= 300),
  status public.activity_status not null default 'Programada',
  material_link text not null default '',
  operator_opinion text not null default '' check (char_length(operator_opinion) <= 5000),
  reference_link text not null default '',
  version integer not null default 1 check (version > 0),
  idempotency_key uuid,
  idempotency_hash text,
  thread_opened_at timestamptz,
  delivered_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete restrict,
  deletion_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_material_link_safe check (
    material_link = '' or private.is_safe_https_url(material_link)
  ),
  constraint activities_reference_link_safe check (
    reference_link = '' or private.is_safe_https_url(reference_link)
  ),
  constraint activities_origin_creator_role check (
    (origin = 'operario' and created_by_role = 'operario')
    or (origin = 'burson' and created_by_role = 'burson')
  ),
  constraint activities_idempotency_pair check (
    (idempotency_key is null and idempotency_hash is null)
    or (
      idempotency_key is not null
      and idempotency_hash is not null
      and idempotency_hash ~ '^[0-9a-f]{64}$'
    )
  ),
  constraint activities_delivery_complete check (
    (status = 'Entregada' and material_link <> '' and delivered_at is not null)
    or (status <> 'Entregada' and delivered_at is null)
  ),
  constraint activities_soft_delete_complete check (
    (deleted_at is null and deleted_by is null and deletion_reason is null)
    or (
      deleted_at is not null
      and deleted_by is not null
      and deletion_reason is not null
      and char_length(btrim(deletion_reason)) between 2 and 1000
    )
  )
);

create unique index activities_idempotency_unique
  on public.activities (created_by, idempotency_key)
  where idempotency_key is not null;
create index activities_responsible_idx
  on public.activities (responsible_id, status, updated_at desc)
  where deleted_at is null;
create index activities_origin_creator_idx
  on public.activities (origin, created_by, updated_at desc)
  where deleted_at is null;

create table public.activity_date_spans (
  id bigint generated always as identity primary key,
  activity_id uuid not null references public.activities(id) on delete cascade,
  position smallint not null check (position between 1 and 100),
  start_date date not null,
  end_date date not null,
  constraint activity_date_spans_order check (end_date >= start_date),
  constraint activity_date_spans_max_length check (end_date - start_date <= 3660),
  constraint activity_date_spans_position_unique unique (activity_id, position)
);

create index activity_date_spans_lookup_idx
  on public.activity_date_spans (start_date, end_date, activity_id);

create table public.audit_events (
  id bigint generated always as identity primary key,
  activity_id uuid not null references public.activities(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  actor_name text not null,
  actor_role public.app_role not null,
  action text not null check (char_length(btrim(action)) between 2 and 180),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_activity_idx
  on public.audit_events (activity_id, created_at desc);

create function private.current_session_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select case
    when coalesce(auth.jwt() ->> 'session_id', '') ~
      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    then (auth.jwt() ->> 'session_id')::uuid
    else null
  end;
$$;

create function private.has_active_app_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_sessions session
    join public.profiles profile on profile.id = session.user_id
    where session.session_id = private.current_session_id()
      and session.user_id = auth.uid()
      and session.revoked_at is null
      and now() < session.expires_at
      and profile.is_active
  );
$$;

create function private.current_app_role()
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
    and private.has_active_app_session();
$$;

create function private.can_view_activity(
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
      or (
        activity_origin = 'burson'
        and exists (
          select 1
          from public.profiles profile
          where profile.id = auth.uid()
            and profile.is_active
            and profile.role = 'operario'
            and profile.is_burson_operator
        )
      )
    when private.current_app_role() = 'burson' then
      activity_origin = 'burson' and activity_created_by = auth.uid()
    else false
  end;
$$;

create function private.can_view_activity_id(target_activity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select private.can_view_activity(
      activity.origin,
      activity.created_by,
      activity.responsible_id,
      activity.deleted_at
    )
    from public.activities activity
    where activity.id = target_activity_id
  ), false);
$$;

alter table public.profiles enable row level security;
alter table public.app_sessions enable row level security;
alter table public.activities enable row level security;
alter table public.activity_date_spans enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_authorized
on public.profiles
for select
to authenticated
using (
  private.has_active_app_session()
  and (id = auth.uid() or private.current_app_role() = 'admin')
);

create policy activities_select_authorized
on public.activities
for select
to authenticated
using (
  private.can_view_activity(origin, created_by, responsible_id, deleted_at)
);

create policy activity_date_spans_select_authorized
on public.activity_date_spans
for select
to authenticated
using (private.can_view_activity_id(activity_id));

create policy audit_events_select_authorized
on public.audit_events
for select
to authenticated
using (
  private.current_app_role() <> 'burson'
  and private.can_view_activity_id(activity_id)
);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.app_sessions from anon, authenticated;
revoke all on table public.activities from anon, authenticated;
revoke all on table public.activity_date_spans from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.activities to authenticated;
grant select on public.activity_date_spans to authenticated;
grant select on public.audit_events to authenticated;

grant usage on schema private to authenticated;

create function public.register_app_session()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_session uuid := private.current_session_id();
begin
  if caller_id is null or caller_session is null then
    raise exception using errcode = 'SR002', message = 'authenticated session required';
  end if;
  if not exists (
    select 1 from public.profiles profile
    where profile.id = caller_id and profile.is_active
  ) then
    raise exception using errcode = 'SR002', message = 'active profile required';
  end if;

  insert into public.app_sessions (session_id, user_id)
  values (caller_session, caller_id)
  on conflict (session_id) do nothing;
end;
$$;

create function public.revoke_current_app_session()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.app_sessions
  set revoked_at = coalesce(revoked_at, now())
  where session_id = private.current_session_id()
    and user_id = auth.uid();
$$;

create function private.require_operator_profile()
returns public.profiles
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  profile public.profiles%rowtype;
begin
  if not private.has_active_app_session() then
    raise exception using errcode = 'SR002', message = 'active app session required';
  end if;
  select candidate.* into profile
  from public.profiles candidate
  where candidate.id = auth.uid()
    and candidate.is_active
    and candidate.role = 'operario';
  if not found then
    raise exception using errcode = 'SR002', message = 'operator role required';
  end if;
  return profile;
end;
$$;

create function private.assert_activity_payload(
  payload_title text,
  payload_description text,
  payload_spans jsonb,
  payload_material_link text
)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  span_count integer;
begin
  if payload_title is null
    or char_length(btrim(payload_title)) not between 2 and 180
    or payload_description is null
    or char_length(btrim(payload_description)) not between 2 and 5000 then
    raise exception using errcode = 'SR003', message = 'invalid required fields';
  end if;
  if payload_spans is null
    or jsonb_typeof(payload_spans) is distinct from 'array' then
    raise exception using errcode = 'SR003', message = 'spans must be an array';
  end if;
  span_count := jsonb_array_length(payload_spans);
  if span_count not between 1 and 100 then
    raise exception using errcode = 'SR003', message = 'invalid span count';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(payload_spans) span
    where not (span ? 'start' and span ? 'end')
      or (span ->> 'start') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      or (span ->> 'end') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      or (span ->> 'start')::date < date '2026-01-01'
      or (span ->> 'end')::date < (span ->> 'start')::date
      or (span ->> 'end')::date - (span ->> 'start')::date > 3660
  ) then
    raise exception using errcode = 'SR003', message = 'invalid date span';
  end if;
  if payload_material_link <> ''
    and not private.is_safe_https_url(payload_material_link) then
    raise exception using errcode = 'SR005', message = 'invalid material link';
  end if;
exception
  when invalid_datetime_format or datetime_field_overflow then
    raise exception using errcode = 'SR003', message = 'invalid date span';
end;
$$;

create function public.create_activity_v1(
  p_idempotency_key uuid,
  p_type public.activity_type,
  p_title text,
  p_description text,
  p_place text,
  p_spans jsonb,
  p_material_link text default '',
  p_operator_opinion text default ''
)
returns table (activity_id uuid, activity_version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.profiles%rowtype := private.require_operator_profile();
  new_activity_id uuid;
  new_version integer;
  request_hash text;
  replay_matches boolean;
  was_replayed boolean := false;
begin
  perform private.assert_activity_payload(
    p_title, p_description, p_spans, btrim(coalesce(p_material_link, ''))
  );
  if p_idempotency_key is null
    or p_type is null
    or char_length(coalesce(p_place, '')) > 300
    or char_length(coalesce(p_operator_opinion, '')) > 5000 then
    raise exception using errcode = 'SR003', message = 'invalid activity data';
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
          'material_link', btrim(coalesce(p_material_link, '')),
          'operator_opinion', btrim(coalesce(p_operator_opinion, ''))
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
      type, title, description, place, material_link, operator_opinion,
      idempotency_key, idempotency_hash
    ) values (
      'operario', profile.id, profile.role, profile.id, profile.display_name,
      p_type, btrim(p_title), btrim(p_description), btrim(coalesce(p_place, '')),
      btrim(coalesce(p_material_link, '')),
      btrim(coalesce(p_operator_opinion, '')), p_idempotency_key, request_hash
    ) returning id, version into new_activity_id, new_version;
  exception when unique_violation then
    select
      activity.id,
      activity.version,
      activity.deleted_at is null and activity.idempotency_hash = request_hash
    into new_activity_id, new_version, replay_matches
    from public.activities activity
    where activity.created_by = profile.id
      and activity.idempotency_key = p_idempotency_key;
    if new_activity_id is null then raise; end if;
    if replay_matches is distinct from true then
      raise exception using
        errcode = 'SR006',
        message = 'idempotency key reused with a different request';
    end if;
    was_replayed := true;
  end;

  if not was_replayed then
    insert into public.activity_date_spans (
      activity_id, position, start_date, end_date
    )
    select
      new_activity_id,
      entry.position::smallint,
      (span ->> 'start')::date,
      (span ->> 'end')::date
    from jsonb_array_elements(p_spans) with ordinality as entry(span, position);

    insert into public.audit_events (
      activity_id, actor_id, actor_name, actor_role, action
    ) values (
      new_activity_id, profile.id, profile.display_name, profile.role,
      'Actividad creada'
    );
  end if;

  return query select new_activity_id, new_version, was_replayed;
end;
$$;

create function public.edit_activity_v1(
  p_activity_id uuid,
  p_expected_version integer,
  p_type public.activity_type,
  p_title text,
  p_description text,
  p_place text,
  p_spans jsonb,
  p_material_link text default '',
  p_operator_opinion text default ''
)
returns table (activity_id uuid, activity_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.profiles%rowtype := private.require_operator_profile();
  activity public.activities%rowtype;
  next_version integer;
begin
  perform private.assert_activity_payload(
    p_title, p_description, p_spans, btrim(coalesce(p_material_link, ''))
  );
  select candidate.* into activity
  from public.activities candidate
  where candidate.id = p_activity_id
  for update;

  if not found or activity.deleted_at is not null
    or activity.responsible_id <> profile.id then
    raise exception using errcode = 'SR002', message = 'activity not editable';
  end if;
  if p_expected_version is null
    or activity.version <> p_expected_version then
    raise exception using errcode = 'SR001', message = 'version conflict';
  end if;
  if char_length(coalesce(p_place, '')) > 300
    or char_length(coalesce(p_operator_opinion, '')) > 5000 then
    raise exception using errcode = 'SR003', message = 'invalid activity data';
  end if;

  next_version := activity.version + 1;
  update public.activities target
  set type = p_type,
      title = btrim(p_title),
      description = btrim(p_description),
      place = btrim(coalesce(p_place, '')),
      material_link = case
        when activity.thread_opened_at is null
          then btrim(coalesce(p_material_link, ''))
        else activity.material_link
      end,
      operator_opinion = case
        when activity.thread_opened_at is null
          then btrim(coalesce(p_operator_opinion, ''))
        else activity.operator_opinion
      end,
      version = next_version,
      updated_at = now()
  where target.id = activity.id;

  delete from public.activity_date_spans span
  where span.activity_id = activity.id;
  insert into public.activity_date_spans (
    activity_id, position, start_date, end_date
  )
  select
    activity.id,
    entry.position::smallint,
    (span ->> 'start')::date,
    (span ->> 'end')::date
  from jsonb_array_elements(p_spans) with ordinality as entry(span, position);

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action
  ) values (
    activity.id, profile.id, profile.display_name, profile.role,
    'Actividad editada'
  );

  return query select activity.id, next_version;
end;
$$;

create function public.advance_activity_v1(
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
  profile public.profiles%rowtype := private.require_operator_profile();
  activity public.activities%rowtype;
  next_status public.activity_status;
  next_version integer;
begin
  select candidate.* into activity
  from public.activities candidate
  where candidate.id = p_activity_id
  for update;

  if not found or activity.deleted_at is not null
    or activity.responsible_id <> profile.id then
    raise exception using errcode = 'SR002', message = 'activity not editable';
  end if;
  if p_expected_version is null
    or activity.version <> p_expected_version then
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
    activity_id, actor_id, actor_name, actor_role, action,
    detail
  ) values (
    activity.id, profile.id, profile.display_name, profile.role,
    'Estado cambiado', jsonb_build_object('estado', next_status)
  );

  return query select activity.id, next_version, next_status;
end;
$$;

revoke all on function public.register_app_session() from public, anon;
revoke all on function public.revoke_current_app_session() from public, anon;
revoke all on function public.create_activity_v1(
  uuid, public.activity_type, text, text, text, jsonb, text, text
) from public, anon;
revoke all on function public.edit_activity_v1(
  uuid, integer, public.activity_type, text, text, text, jsonb, text, text
) from public, anon;
revoke all on function public.advance_activity_v1(uuid, integer)
  from public, anon;

revoke all on function private.is_safe_https_url(text)
  from public, anon, authenticated;
revoke all on function private.current_session_id()
  from public, anon, authenticated;
revoke all on function private.has_active_app_session()
  from public, anon, authenticated;
revoke all on function private.current_app_role()
  from public, anon, authenticated;
revoke all on function private.can_view_activity(
  public.activity_origin, uuid, uuid, timestamptz
) from public, anon, authenticated;
revoke all on function private.can_view_activity_id(uuid)
  from public, anon, authenticated;
revoke all on function private.require_operator_profile()
  from public, anon, authenticated;
revoke all on function private.assert_activity_payload(text, text, jsonb, text)
  from public, anon, authenticated;

grant execute on function private.current_session_id() to authenticated;
grant execute on function private.has_active_app_session() to authenticated;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.can_view_activity(
  public.activity_origin, uuid, uuid, timestamptz
) to authenticated;
grant execute on function private.can_view_activity_id(uuid) to authenticated;

grant execute on function public.register_app_session() to authenticated;
grant execute on function public.revoke_current_app_session() to authenticated;
grant execute on function public.create_activity_v1(
  uuid, public.activity_type, text, text, text, jsonb, text, text
) to authenticated;
grant execute on function public.edit_activity_v1(
  uuid, integer, public.activity_type, text, text, text, jsonb, text, text
) to authenticated;
grant execute on function public.advance_activity_v1(uuid, integer)
  to authenticated;

comment on schema private is
  'Funciones internas de autorización; no exponer mediante Data API.';
comment on table public.app_sessions is
  'Límite de sesión de Sistema R: máximo 12 horas y revocación inmediata.';
comment on column public.activities.thread_opened_at is
  'Reserva el bloqueo de enlace/opinión; los mensajes se implementan en otro corte.';

commit;
