begin;

-- Forward-only retirement: preserve accounts, activity origins, messages and evidence.
-- Apply to existing databases only after explicit authorization and database backup.
select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sistema-r-account-administration',0));
update public.app_sessions s set revoked_at=coalesce(s.revoked_at,now())
from public.profiles p where s.user_id=p.id and (p.role='burson' or p.is_burson_operator);
update public.profiles set is_active=false, is_burson_operator=false, can_create_own_activities=false, updated_at=now()
where role='burson';
update public.profiles set is_burson_operator=false, updated_at=now() where is_burson_operator;

alter table public.profiles add constraint profiles_burson_retired
  check (not is_burson_operator and (role <> 'burson' or not is_active));
create function private.guard_retired_burson_profile() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.is_burson_operator or new.role='burson' and (TG_OP='INSERT' or new.is_active) then
    raise exception using errcode='SR009',message='Burson role and link are retired';
  end if;
  if TG_OP='UPDATE' then
    if old.role='burson' and new.role<>'burson' then
      raise exception using errcode='SR009',message='retired account remains archived';
    end if;
  end if;
  return new;
end;
$$;
create trigger profiles_retired_burson before insert or update on public.profiles
for each row execute function private.guard_retired_burson_profile();
revoke all on function private.guard_retired_burson_profile() from public,anon,authenticated,service_role;

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
    and profile.role <> 'burson'
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
    else false
  end;
$$;

revoke all on function public.create_burson_request_v1(uuid,public.activity_type,text,text,text,jsonb,text)
from public,anon,authenticated,service_role;
revoke all on function public.create_burson_request_v2(uuid,public.activity_type,text,text,text,jsonb,text)
from public,anon,authenticated,service_role;

-- Normal operators may now receive legacy open activities. Delivery locks unchanged.
create or replace function public.replan_activity_v1(
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

create or replace function public.restore_activity_v1(
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

-- The public projection no longer reveals archived messages or their counts.
revoke all on public.aunor_messages from public,anon,authenticated,service_role;
create or replace view public.aunor_activities with (security_invoker=false,security_barrier=true) as
select a.id,a.type,a.title,a.status,a.place,p.summary,p.service_id,
  case when a.status='Entregada' then '' else p.not_performed_reason end as not_performed_reason,
  p.version as publication_version,p.published_at,0::integer as unread_count
from public.activities a
join private.aunor_publications p on p.activity_id=a.id and p.superseded_at is null
where private.can_access_aunor_activity(a.id);

create or replace function public.aunor_mutate_v1(
  p_command text, p_activity_id uuid, p_request_id uuid, p_payload jsonb
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor public.profiles%rowtype;
  activity public.activities%rowtype;
  other_activity public.activities%rowtype;
  publication private.aunor_publications%rowtype;
  delivery private.aunor_deliveries%rowtype;
  replacement private.aunor_replacements%rowtype;
  agreement private.aunor_agreements%rowtype;
  previous_message private.aunor_messages%rowtype;
  object_id uuid;
  other_id uuid;
  correction_id uuid;
  confirmation_id uuid;
  expected integer;
  revision integer;
  next_version integer;
  last_sequence bigint;
  normalized text;
  reason text;
  evidence text;
  service text;
  fingerprint text;
  previous_request private.aunor_requests%rowtype;
  result jsonb;
  allowed_keys text[];
begin
  -- Reject even replays of archived message/read requests.
  if p_command in ('message','read') then
    raise exception using errcode='SR002', message='external conversation retired';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sistema-r-aunor-channel-v1',0)
  );
  actor := private.require_active_profile();
  if actor.role not in ('admin','aunor') then
    raise exception using errcode='SR002', message='Aunor channel unavailable';
  end if;
  if p_command is null or p_activity_id is null or p_request_id is null
    or p_payload is null or jsonb_typeof(p_payload)<>'object'
    or octet_length(p_payload::text)>32000 then
    raise exception using errcode='SR003', message='invalid Aunor request';
  end if;
  case p_command
    when 'publish' then allowed_keys := array['expectedVersion','summary','serviceId','notPerformedReason'];
    when 'delivery' then allowed_keys := array['expectedActivityVersion','label'];
    when 'agreement' then allowed_keys := array['channel','contactedAt','requesterDeclared','body','evidenceLink','correctsId'];
    when 'replacement' then allowed_keys := array['substituteId','agreementId','reason','evidenceNote','evidenceLink','correctsId'];
    when 'message' then allowed_keys := array['body','correctsId'];
    when 'read' then allowed_keys := array['sequence'];
    when 'confirm-delivery' then allowed_keys := array['objectId','version','acknowledged'];
    when 'confirm-replacement' then allowed_keys := array['objectId','acknowledged'];
    else raise exception using errcode='SR003', message='invalid Aunor command';
  end case;
  if exists(select 1 from jsonb_object_keys(p_payload) k where not(k=any(allowed_keys))) then
    raise exception using errcode='SR003', message='unexpected Aunor fields';
  end if;
  if p_command in ('publish','delivery','agreement','replacement') and actor.role<>'admin'
    or p_command in ('confirm-delivery','confirm-replacement') and actor.role<>'aunor' then
    raise exception using errcode='SR002', message='action not authorized';
  end if;

  if p_command='replacement' then
    other_id := (p_payload->>'substituteId')::uuid;
    if other_id is null or other_id=p_activity_id then
      raise exception using errcode='SR003', message='invalid replacement';
    end if;
  elsif p_command='confirm-replacement' then
    select r.substitute_activity_id into other_id from private.aunor_replacements r
    where r.id=(p_payload->>'objectId')::uuid and r.original_activity_id=p_activity_id;
    if not found then
      raise exception using errcode='SR002', message='replacement unavailable';
    end if;
  end if;
  perform a.id from public.activities a
    where a.id=p_activity_id or a.id=other_id order by a.id for update;
  select a.* into activity from public.activities a where a.id=p_activity_id;
  if not found or activity.deleted_at is not null or activity.origin='burson' then
    raise exception using errcode='SR002', message='activity unavailable';
  end if;
  if other_id is not null then
    select a.* into other_activity from public.activities a where a.id=other_id;
    if not found or not private.can_access_aunor_activity(other_id) then
      raise exception using errcode='SR002', message='replacement unavailable';
    end if;
  end if;
  if p_command<>'publish' and not private.can_access_aunor_activity(p_activity_id) then
    raise exception using errcode='SR002', message='publication unavailable';
  end if;
  fingerprint := pg_catalog.md5(jsonb_build_array(p_command,p_activity_id,p_payload)::text);
  select r.* into previous_request from private.aunor_requests r
    where r.actor_id=actor.id and r.request_id=p_request_id;
  if found then
    if previous_request.fingerprint<>fingerprint then
      raise exception using errcode='SR006', message='request key reused with other input';
    end if;
    return previous_request.result;
  end if;

  case p_command
  when 'publish' then
    select p.* into publication from private.aunor_publications p
      where p.activity_id=p_activity_id and p.superseded_at is null for update;
    expected := (p_payload->>'expectedVersion')::integer;
    normalized := btrim(coalesce(p_payload->>'summary',''));
    reason := btrim(coalesce(p_payload->>'notPerformedReason',''));
    service := nullif(p_payload->>'serviceId','');
    if expected is null or expected<>coalesce(publication.version,0) then
      raise exception using errcode='SR001', message='publication changed';
    end if;
    if char_length(normalized) not between 1 and 5000 or char_length(reason)>3000
      or (reason<>'' and activity.status='Entregada')
      or (service is not null and not exists(select 1 from private.aunor_services s where s.id=service)) then
      raise exception using errcode='SR003', message='invalid publication';
    end if;
    update private.aunor_publications set superseded_at=now()
      where id=publication.id;
    insert into private.aunor_publications(activity_id,version,summary,service_id,not_performed_reason,recorded_by)
      values(p_activity_id,expected+1,normalized,service,reason,actor.id)
      returning id into object_id;
    result := jsonb_build_object('id',object_id,'version',expected+1);

  when 'delivery' then
    expected := (p_payload->>'expectedActivityVersion')::integer;
    normalized := btrim(coalesce(p_payload->>'label',''));
    if expected is null or expected<>activity.version then
      raise exception using errcode='SR001', message='activity changed';
    end if;
    if activity.status<>'Entregada' or activity.material_link=''
      or char_length(normalized) not between 1 and 180 then
      raise exception using errcode='SR003', message='delivery is not ready';
    end if;
    select coalesce(max(d.version),0)+1 into next_version
      from private.aunor_deliveries d where d.activity_id=p_activity_id;
    select coalesce((select r.revision from private.aunor_material_revisions r where r.activity_id=p_activity_id),0) into revision;
    insert into private.aunor_deliveries(activity_id,version,material_revision,material_link,label,published_by)
      values(p_activity_id,next_version,revision,activity.material_link,normalized,actor.id)
      returning id into object_id;
    result := jsonb_build_object('id',object_id,'version',next_version);

  when 'agreement' then
    correction_id := nullif(p_payload->>'correctsId','')::uuid;
    if correction_id is not null and not exists(
      select 1 from private.aunor_agreements g where g.id=correction_id and g.activity_id=p_activity_id
        and not exists(select 1 from private.aunor_agreements n where n.corrects_id=g.id)
    ) then
      raise exception using errcode='SR002', message='agreement unavailable';
    end if;
    if p_payload->>'channel' is null or p_payload->>'contactedAt' is null then
      raise exception using errcode='SR003', message='agreement details required';
    end if;
    insert into private.aunor_agreements(activity_id,channel,contacted_at,requester_declared,body,evidence_link,recorded_by,corrects_id)
      values(p_activity_id,p_payload->>'channel',(p_payload->>'contactedAt')::timestamptz,
        btrim(coalesce(p_payload->>'requesterDeclared','')),btrim(coalesce(p_payload->>'body','')),
        btrim(coalesce(p_payload->>'evidenceLink','')),actor.id,correction_id)
      returning id into object_id;
    result := jsonb_build_object('id',object_id);

  when 'replacement' then
    object_id := (p_payload->>'agreementId')::uuid;
    select g.* into agreement from private.aunor_agreements g
      where g.id=object_id and g.activity_id in (p_activity_id,other_id);
    if not found then
      raise exception using errcode='SR002', message='agreement unavailable';
    end if;
    correction_id := nullif(p_payload->>'correctsId','')::uuid;
    if correction_id is not null and not exists(
      select 1 from private.aunor_replacements r where r.id=correction_id
        and r.original_activity_id=p_activity_id
        and private.can_access_aunor_activity(r.substitute_activity_id)
        and not exists(select 1 from private.aunor_replacements n where n.corrects_id=r.id)
    ) then
      raise exception using errcode='SR002', message='replacement correction unavailable';
    end if;
    insert into private.aunor_replacements(original_activity_id,substitute_activity_id,original_title,substitute_title,
      agreement_id,reason,evidence_note,evidence_link,recorded_by,corrects_id)
      values(p_activity_id,other_id,activity.title,other_activity.title,object_id,
        btrim(coalesce(p_payload->>'reason','')),btrim(coalesce(p_payload->>'evidenceNote','')),
        btrim(coalesce(p_payload->>'evidenceLink','')),actor.id,correction_id)
      returning id into object_id;
    result := jsonb_build_object('id',object_id);

  when 'message' then
    normalized := btrim(coalesce(p_payload->>'body',''));
    if char_length(normalized) not between 1 and 5000 then
      raise exception using errcode='SR003', message='invalid message body';
    end if;
    correction_id := nullif(p_payload->>'correctsId','')::uuid;
    if correction_id is not null then
      select m.* into previous_message from private.aunor_messages m
        where m.id=correction_id and m.activity_id=p_activity_id and m.author_id=actor.id;
      if not found then
        raise exception using errcode='SR002', message='only own external messages may be corrected';
      end if;
    end if;
    insert into private.aunor_messages(activity_id,author_id,author_role,body,corrects_id)
      values(p_activity_id,actor.id,actor.role,normalized,correction_id)
      returning id into object_id;
    result := jsonb_build_object('id',object_id);

  when 'read' then
    last_sequence := (p_payload->>'sequence')::bigint;
    if last_sequence is null or last_sequence<0 or (last_sequence>0 and not exists(
      select 1 from private.aunor_messages m where m.activity_id=p_activity_id and m.sequence=last_sequence
    )) then
      raise exception using errcode='SR003', message='invalid read position';
    end if;
    insert into private.aunor_read_markers(activity_id,profile_id,last_sequence)
      values(p_activity_id,actor.id,last_sequence)
      on conflict(activity_id,profile_id) do update
        set last_sequence=greatest(private.aunor_read_markers.last_sequence,excluded.last_sequence);
    result := jsonb_build_object('sequence',last_sequence);

  when 'confirm-delivery' then
    if p_payload->'acknowledged' is distinct from 'true'::jsonb then
      raise exception using errcode='SR003', message='explicit confirmation required';
    end if;
    object_id := (p_payload->>'objectId')::uuid;
    expected := (p_payload->>'version')::integer;
    select d.* into delivery from private.aunor_deliveries d
      where d.id=object_id and d.activity_id=p_activity_id for update;
    if not found then
      raise exception using errcode='SR002', message='delivery unavailable';
    end if;
    if expected is null or expected<>delivery.version or activity.status<>'Entregada'
      or activity.material_link<>delivery.material_link
      or delivery.material_revision<>coalesce((select r.revision from private.aunor_material_revisions r where r.activity_id=p_activity_id),0)
      or exists(select 1 from private.aunor_deliveries n where n.activity_id=p_activity_id and n.version>delivery.version) then
      raise exception using errcode='SR001', message='delivery changed; review the current delivery';
    end if;
    insert into private.aunor_confirmations(delivery_id,confirmed_by)
      values(object_id,actor.id) on conflict(delivery_id) do nothing;
    select c.id into confirmation_id from private.aunor_confirmations c where c.delivery_id=object_id;
    result := jsonb_build_object('id',confirmation_id,'objectId',object_id,'objectType','delivery');

  when 'confirm-replacement' then
    if p_payload->'acknowledged' is distinct from 'true'::jsonb then
      raise exception using errcode='SR003', message='explicit confirmation required';
    end if;
    object_id := (p_payload->>'objectId')::uuid;
    select r.* into replacement from private.aunor_replacements r
      where r.id=object_id and r.original_activity_id=p_activity_id for update;
    if not found or not exists(select 1 from private.aunor_agreements g
      where g.id=replacement.agreement_id and private.can_access_aunor_activity(g.activity_id)) then
      raise exception using errcode='SR002', message='replacement unavailable';
    end if;
    if exists(select 1 from private.aunor_replacements n where n.corrects_id=object_id) then
      raise exception using errcode='SR001', message='replacement changed';
    end if;
    insert into private.aunor_confirmations(replacement_id,confirmed_by)
      values(object_id,actor.id) on conflict(replacement_id) do nothing;
    select c.id into confirmation_id from private.aunor_confirmations c where c.replacement_id=object_id;
    result := jsonb_build_object('id',confirmation_id,'objectId',object_id,'objectType','replacement');
  end case;

  insert into private.aunor_requests(actor_id,request_id,fingerprint,result)
    values(actor.id,p_request_id,fingerprint,result);
  if p_command<>'read' then
    insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
      values(p_activity_id,actor.id,case when actor.role='aunor' then 'Aunor' else actor.display_name end,
        actor.role,'Espacio Aunor: '||p_command,jsonb_build_object('result',result));
  end if;
  return result;
exception
  when invalid_text_representation or invalid_datetime_format or datetime_field_overflow
    or numeric_value_out_of_range or check_violation or not_null_violation then
    raise exception using errcode='SR003', message='invalid Aunor input';
end;
$$;

comment on table private.aunor_messages is 'Archived external conversation. Retired 2026-09-08; not exposed to application roles.';
commit;
