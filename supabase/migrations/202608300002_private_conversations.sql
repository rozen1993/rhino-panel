begin;

create table public.activity_messages (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  author_name text not null check (
    char_length(btrim(author_name)) between 2 and 120
  ),
  author_role public.app_role not null,
  body text not null,
  opens_thread boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete restrict,
  constraint activity_messages_internal_author check (
    author_role in ('admin', 'operario')
  ),
  constraint activity_messages_opened_by_admin check (
    not opens_thread or author_role = 'admin'
  ),
  constraint activity_messages_body_valid check (
    body = btrim(body) and char_length(body) between 1 and 5000
  ),
  constraint activity_messages_edit_time check (
    edited_at is null or edited_at >= created_at
  ),
  constraint activity_messages_soft_delete_complete check (
    (deleted_at is null and deleted_by is null)
    or (
      deleted_at is not null
      and deleted_at >= created_at
      and deleted_by = author_id
    )
  )
);

create unique index activity_messages_single_opening
  on public.activity_messages (activity_id)
  where opens_thread;

create index activity_messages_activity_created_idx
  on public.activity_messages (activity_id, created_at, id)
  where deleted_at is null;

create function private.can_access_activity_conversation(
  target_activity_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when private.current_app_role() = 'admin' then true
      when private.current_app_role() = 'operario' then
        activity.deleted_at is null
        and activity.responsible_id = auth.uid()
      else false
    end
    from public.activities activity
    where activity.id = target_activity_id
  ), false);
$$;

alter table public.activity_messages enable row level security;

create policy activity_messages_select_participants
on public.activity_messages
for select
to authenticated
using (
  deleted_at is null
  and private.can_access_activity_conversation(activity_id)
);

revoke all on table public.activity_messages
  from public, anon, authenticated, service_role;
grant select on table public.activity_messages to authenticated;

create function public.post_activity_message_v1(
  p_activity_id uuid,
  p_expected_activity_version integer,
  p_body text
)
returns table (
  activity_id uuid,
  activity_version integer,
  message_id uuid,
  message_version integer,
  opened_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles%rowtype := private.require_active_profile();
  activity public.activities%rowtype;
  normalized_body text := btrim(coalesce(p_body, ''));
  is_opening boolean := p_expected_activity_version is not null;
  next_activity_version integer;
  new_message_id uuid;
  conversation_opened_at timestamptz;
begin
  if char_length(normalized_body) not between 1 and 5000 then
    raise exception using errcode = 'SR003', message = 'invalid message body';
  end if;

  if is_opening then
    select candidate.* into activity
    from public.activities candidate
    where candidate.id = p_activity_id
    for update;
  else
    select candidate.* into activity
    from public.activities candidate
    where candidate.id = p_activity_id
    for share;
  end if;

  if not found or activity.deleted_at is not null then
    raise exception using errcode = 'SR002', message = 'conversation unavailable';
  end if;
  if actor.role = 'burson'
    or (
      actor.role = 'operario'
      and activity.responsible_id <> actor.id
    ) then
    raise exception using errcode = 'SR002', message = 'conversation unavailable';
  end if;
  if activity.status <> 'Entregada' then
    raise exception using errcode = 'SR008', message = 'conversation is not enabled';
  end if;

  if is_opening then
    if actor.role <> 'admin' then
      raise exception using errcode = 'SR008', message = 'Admin must open the conversation';
    end if;
    if activity.thread_opened_at is not null
      or activity.version <> p_expected_activity_version then
      raise exception using errcode = 'SR001', message = 'conversation version conflict';
    end if;

    conversation_opened_at := now();
    next_activity_version := activity.version + 1;
    update public.activities target
    set thread_opened_at = conversation_opened_at,
        version = next_activity_version,
        updated_at = conversation_opened_at
    where target.id = activity.id;
  else
    if activity.thread_opened_at is null then
      raise exception using errcode = 'SR008', message = 'Admin must open the conversation';
    end if;
    conversation_opened_at := activity.thread_opened_at;
    next_activity_version := activity.version;
  end if;

  insert into public.activity_messages (
    activity_id, author_id, author_name, author_role, body, opens_thread
  ) values (
    activity.id, actor.id, actor.display_name, actor.role,
    normalized_body, is_opening
  )
  returning id into new_message_id;

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action, detail
  ) values (
    activity.id,
    actor.id,
    actor.display_name,
    actor.role,
    case
      when is_opening then 'Admin inició la conversación'
      else 'Mensaje agregado'
    end,
    jsonb_build_object(
      'mensaje_id', new_message_id,
      'apertura', is_opening
    )
  );

  return query select
    activity.id,
    next_activity_version,
    new_message_id,
    1,
    conversation_opened_at;
end;
$$;

create function public.edit_activity_message_v1(
  p_message_id uuid,
  p_expected_message_version integer,
  p_body text
)
returns table (
  activity_id uuid,
  activity_version integer,
  message_id uuid,
  message_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles%rowtype := private.require_active_profile();
  target_activity_id uuid;
  activity public.activities%rowtype;
  message_record public.activity_messages%rowtype;
  normalized_body text := btrim(coalesce(p_body, ''));
  next_message_version integer;
begin
  if char_length(normalized_body) not between 1 and 5000 then
    raise exception using errcode = 'SR003', message = 'invalid message body';
  end if;

  select candidate.activity_id into target_activity_id
  from public.activity_messages candidate
  where candidate.id = p_message_id;

  if not found then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;

  select candidate.* into activity
  from public.activities candidate
  where candidate.id = target_activity_id
  for share;

  if not found or activity.deleted_at is not null
    or actor.role = 'burson'
    or (
      actor.role = 'operario'
      and activity.responsible_id <> actor.id
    ) then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;
  if activity.status <> 'Entregada' or activity.thread_opened_at is null then
    raise exception using errcode = 'SR008', message = 'conversation is not enabled';
  end if;

  select candidate.* into message_record
  from public.activity_messages candidate
  where candidate.id = p_message_id
    and candidate.activity_id = activity.id
  for update;

  if not found or message_record.deleted_at is not null
    or message_record.author_id <> actor.id then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;
  if p_expected_message_version is null
    or message_record.version <> p_expected_message_version then
    raise exception using errcode = 'SR001', message = 'message version conflict';
  end if;

  next_message_version := message_record.version + 1;
  update public.activity_messages target
  set body = normalized_body,
      edited_at = now(),
      version = next_message_version
  where target.id = message_record.id;

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action, detail
  ) values (
    activity.id,
    actor.id,
    actor.display_name,
    actor.role,
    'Mensaje editado',
    jsonb_build_object('mensaje_id', message_record.id)
  );

  return query select
    activity.id,
    activity.version,
    message_record.id,
    next_message_version;
end;
$$;

create function public.delete_activity_message_v1(
  p_message_id uuid,
  p_expected_message_version integer
)
returns table (
  activity_id uuid,
  activity_version integer,
  message_id uuid,
  message_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles%rowtype := private.require_active_profile();
  target_activity_id uuid;
  activity public.activities%rowtype;
  message_record public.activity_messages%rowtype;
  next_message_version integer;
begin
  select candidate.activity_id into target_activity_id
  from public.activity_messages candidate
  where candidate.id = p_message_id;

  if not found then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;

  select candidate.* into activity
  from public.activities candidate
  where candidate.id = target_activity_id
  for share;

  if not found or activity.deleted_at is not null
    or actor.role = 'burson'
    or (
      actor.role = 'operario'
      and activity.responsible_id <> actor.id
    ) then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;
  if activity.status <> 'Entregada' or activity.thread_opened_at is null then
    raise exception using errcode = 'SR008', message = 'conversation is not enabled';
  end if;

  select candidate.* into message_record
  from public.activity_messages candidate
  where candidate.id = p_message_id
    and candidate.activity_id = activity.id
  for update;

  if not found or message_record.deleted_at is not null
    or message_record.author_id <> actor.id then
    raise exception using errcode = 'SR002', message = 'message unavailable';
  end if;
  if p_expected_message_version is null
    or message_record.version <> p_expected_message_version then
    raise exception using errcode = 'SR001', message = 'message version conflict';
  end if;

  next_message_version := message_record.version + 1;
  update public.activity_messages target
  set deleted_at = now(),
      deleted_by = actor.id,
      version = next_message_version
  where target.id = message_record.id;

  insert into public.audit_events (
    activity_id, actor_id, actor_name, actor_role, action, detail
  ) values (
    activity.id,
    actor.id,
    actor.display_name,
    actor.role,
    'Mensaje eliminado lógicamente',
    jsonb_build_object('mensaje_id', message_record.id)
  );

  return query select
    activity.id,
    activity.version,
    message_record.id,
    next_message_version;
end;
$$;

create or replace function public.update_execution_v1(
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
  if activity.thread_opened_at is not null then
    raise exception using
      errcode = 'SR007',
      message = 'execution fields are locked by the conversation';
  end if;
  if p_expected_version is null or activity.version <> p_expected_version then
    raise exception using errcode = 'SR001', message = 'version conflict';
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

revoke all on function private.can_access_activity_conversation(uuid)
  from public, anon, authenticated, service_role;
grant execute on function private.can_access_activity_conversation(uuid)
  to authenticated;

revoke all on function public.post_activity_message_v1(uuid, integer, text)
  from public, anon, authenticated, service_role;
revoke all on function public.edit_activity_message_v1(uuid, integer, text)
  from public, anon, authenticated, service_role;
revoke all on function public.delete_activity_message_v1(uuid, integer)
  from public, anon, authenticated, service_role;
revoke all on function public.update_execution_v1(uuid, integer, text, text)
  from public, anon, authenticated, service_role;

grant execute on function public.post_activity_message_v1(uuid, integer, text)
  to authenticated;
grant execute on function public.edit_activity_message_v1(uuid, integer, text)
  to authenticated;
grant execute on function public.delete_activity_message_v1(uuid, integer)
  to authenticated;
grant execute on function public.update_execution_v1(uuid, integer, text, text)
  to authenticated;

comment on table public.activity_messages is
  'Conversación interna de cada actividad; nunca se expone al rol Burson.';
comment on column public.activity_messages.opens_thread is
  'Marca inmutable del primer mensaje Admin; su baja no reabre la ejecución.';
comment on column public.activities.thread_opened_at is
  'Congela enlace y opinión desde el primer mensaje Admin, aunque ese mensaje se dé de baja.';

commit;
