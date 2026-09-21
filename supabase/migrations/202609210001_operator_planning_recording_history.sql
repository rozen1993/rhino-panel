begin;

-- Existing records remain unclassified; execution never requires reclassifying them.
alter table public.activities add column recording_modes text[] not null default '{}';
alter table public.activities add constraint activities_recording_modes_valid check (
  recording_modes <@ array['Fotografía','Video','Vuelo con dron']::text[]
  and array_position(recording_modes,null) is null
  and (type='Grabación' or cardinality(recording_modes)=0)
);

create function private.normalize_recording_modes(p_type public.activity_type, p_modes text[])
returns text[] language plpgsql immutable set search_path='' as $$
declare result text[];
begin
  if p_type is null or p_modes is null or array_position(p_modes,null) is not null
    or not p_modes <@ array['Fotografía','Video','Vuelo con dron']::text[]
    or cardinality(p_modes) > 3
    or (p_type='Grabación' and cardinality(p_modes)=0)
    or (p_type<>'Grabación' and cardinality(p_modes)>0) then
    raise exception using errcode='SR003',message='invalid recording modes';
  end if;
  select coalesce(array_agg(m order by position),'{}') into result
  from unnest(array['Fotografía','Video','Vuelo con dron']) with ordinality as modes(m,position)
  where m=any(p_modes);
  if cardinality(result)<>cardinality(p_modes) then
    raise exception using errcode='SR003',message='duplicate recording modes';
  end if;
  return result;
end $$;
revoke all on function private.normalize_recording_modes(public.activity_type,text[]) from public,anon,authenticated,service_role;

create function public.plan_activity_v3(p_idempotency_key uuid,p_responsible_id uuid,p_type public.activity_type,p_title text,p_description text,p_place text,p_spans jsonb,p_recording_modes text[])
returns table(activity_id uuid,activity_version integer,replayed boolean)
language plpgsql security definer set search_path='' as $$
declare result record; modes text[];
begin
  modes:=private.normalize_recording_modes(p_type,p_recording_modes);
  select * into result from public.plan_activity_v2(p_idempotency_key,p_responsible_id,p_type,p_title,p_description,p_place,p_spans);
  if result.replayed then
    if (select a.recording_modes from public.activities a where a.id=result.activity_id) is distinct from modes then
      raise exception using errcode='SR006',message='recording modes differ from original request';
    end if;
  else
    update public.activities set recording_modes=modes where id=result.activity_id;
    insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
      select a.id,p.id,p.display_name,p.role,'Modalidades de grabación registradas',jsonb_build_object('modalidades',modes)
      from public.activities a join public.profiles p on p.id=a.created_by where a.id=result.activity_id;
  end if;
  return query select result.activity_id,result.activity_version,result.replayed;
end $$;

create function public.create_own_activity_v3(p_idempotency_key uuid,p_type public.activity_type,p_title text,p_description text,p_place text,p_spans jsonb,p_recording_modes text[])
returns table(activity_id uuid,activity_version integer,replayed boolean)
language plpgsql security definer set search_path='' as $$
declare result record; modes text[];
begin
  modes:=private.normalize_recording_modes(p_type,p_recording_modes);
  select * into result from public.create_own_activity_v2(p_idempotency_key,p_type,p_title,p_description,p_place,p_spans);
  if result.replayed then
    if (select a.recording_modes from public.activities a where a.id=result.activity_id) is distinct from modes then
      raise exception using errcode='SR006',message='recording modes differ from original request';
    end if;
  else
    update public.activities set recording_modes=modes where id=result.activity_id;
    insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
      select a.id,p.id,p.display_name,p.role,'Modalidades de grabación registradas',jsonb_build_object('modalidades',modes)
      from public.activities a join public.profiles p on p.id=a.created_by where a.id=result.activity_id;
  end if;
  return query select result.activity_id,result.activity_version,result.replayed;
end $$;

-- Preserve the Admin rules; clear old modalities within the same transaction
-- when changing to another type, then store the validated selection.
create function public.replan_activity_v3(p_activity_id uuid,p_expected_version integer,p_responsible_id uuid,p_type public.activity_type,p_title text,p_description text,p_place text,p_spans jsonb,p_recording_modes text[])
returns table(activity_id uuid,activity_version integer)
language plpgsql security definer set search_path='' as $$
declare result record; modes text[]; previous text[]; actor public.profiles%rowtype;
begin
  actor:=private.require_admin_profile();
  perform private.require_assignable_operator(p_responsible_id);
  modes:=private.normalize_recording_modes(p_type,p_recording_modes);
  select recording_modes into previous from public.activities where id=p_activity_id for update;
  update public.activities set recording_modes='{}' where id=p_activity_id;
  select * into result from public.replan_activity_v2(p_activity_id,p_expected_version,p_responsible_id,p_type,p_title,p_description,p_place,p_spans);
  update public.activities set recording_modes=modes where id=result.activity_id;
  insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
    values(result.activity_id,actor.id,actor.display_name,actor.role,'Modalidades de grabación actualizadas',jsonb_build_object('antes',previous,'despues',modes));
  return query select result.activity_id,result.activity_version;
end $$;

create function public.replan_own_activity_v3(p_activity_id uuid,p_expected_version integer,p_type public.activity_type,p_title text,p_description text,p_place text,p_spans jsonb,p_recording_modes text[])
returns table(activity_id uuid,activity_version integer)
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; item public.activities%rowtype; modes text[]; spans jsonb; previous_spans jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('sistema-r-account-administration',0));
  actor:=private.require_operator_profile();
  if not actor.can_create_own_activities then raise exception using errcode='SR002',message='creation permission required'; end if;
  select * into item from public.activities where id=p_activity_id for update;
  if not found or item.deleted_at is not null or item.status<>'Programada'
    or item.created_by<>actor.id or item.created_by_role<>'operario' or item.responsible_id<>actor.id then
    raise exception using errcode='SR002',message='only own assigned scheduled activities are editable';
  end if;
  if p_expected_version is null or p_expected_version<>item.version then raise exception using errcode='SR001',message='version conflict'; end if;
  modes:=private.normalize_recording_modes(p_type,p_recording_modes);
  spans:=private.normalize_activity_spans_v2(p_spans);
  perform private.assert_activity_payload(p_title,p_description,spans,'');
  if char_length(coalesce(p_place,''))>300 then raise exception using errcode='SR003',message='invalid place'; end if;
  select jsonb_agg(jsonb_build_object('start',s.start_date,'end',s.end_date,'place',s.place) order by s.position) into previous_spans from public.activity_date_spans s where s.activity_id=item.id;
  update public.activities set type=p_type,title=btrim(p_title),description=btrim(p_description),place=btrim(coalesce(p_place,'')),
    recording_modes=modes,version=version+1,updated_at=now() where id=item.id;
  perform private.replace_activity_spans(item.id,spans);
  insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
  values(item.id,actor.id,actor.display_name,actor.role,'Planificación propia actualizada',jsonb_build_object(
    'antes',jsonb_build_object('tipo',item.type,'titulo',item.title,'descripcion',item.description,'lugar',item.place,'jornadas',previous_spans,'modalidades',item.recording_modes),
    'despues',jsonb_build_object('tipo',p_type,'titulo',btrim(p_title),'descripcion',btrim(p_description),'lugar',btrim(coalesce(p_place,'')),'jornadas',spans,'modalidades',modes)));
  return query select item.id,item.version+1;
end $$;

-- Old entry points cannot bypass mandatory classification. v3 wrappers retain
-- access as their owner; cached clients must refresh before planning writes.
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('plan_activity_v1','plan_activity_v2','create_own_activity_v1','create_own_activity_v2','replan_activity_v1','replan_activity_v2') loop
    execute format('revoke all on function %s from public,anon,authenticated,service_role',f);
  end loop;
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('plan_activity_v3','create_own_activity_v3','replan_activity_v3','replan_own_activity_v3') loop
    execute format('revoke all on function %s from public,anon,authenticated,service_role',f);
    execute format('grant execute on function %s to authenticated',f);
  end loop;
end $$;

-- Team-wide history has its own read-only projection. Activity RLS, private
-- conversations, audit and write permissions remain scoped to each operator.
create view public.team_historical_activities with (security_barrier=true,security_invoker=false) as
select a.id,a.version,a.type,a.title,a.responsible_name,a.status,a.origin,a.description,a.place,a.material_link,a.operator_opinion,a.recording_modes,
  journeys.spans,journeys.first_date,journeys.last_date
from public.activities a cross join lateral (
  select jsonb_agg(jsonb_build_object('start',s.start_date,'end',s.end_date,'place',s.place) order by s.position,s.id) as spans,
    min(s.start_date) as first_date,max(s.end_date) as last_date
  from public.activity_date_spans s where s.activity_id=a.id
) journeys
where a.deleted_at is null and private.current_app_role() in ('admin','operario');
revoke all on public.team_historical_activities from public,anon,authenticated,service_role;
grant select on public.team_historical_activities to authenticated;

create or replace view public.aunor_activities with (security_invoker=false,security_barrier=true) as
select a.id,a.type,a.title,a.status,a.place,
 coalesce(nullif(p.summary,''),a.description) as summary,p.service_id,
 case when a.status='Entregada' then '' else coalesce(p.not_performed_reason,'') end as not_performed_reason,
 coalesce(p.version,0) as publication_version,coalesce(p.published_at,a.created_at) as published_at,0::integer as unread_count,
 a.delivered_at,case when a.status='Entregada' then a.material_link else '' end as material_link,a.recording_modes
from public.activities a left join private.aunor_publications p on p.activity_id=a.id and p.client_code='AUNOR' and p.superseded_at is null
where private.can_access_aunor_activity(a.id);

-- Preserve recording classification when Admin restarts an execution.
alter function public.restart_activity_v2(uuid,integer,text) rename to restart_activity_legacy_v2;
revoke all on function public.restart_activity_legacy_v2(uuid,integer,text) from public,anon,authenticated,service_role;
create function public.restart_activity_v2(p_activity_id uuid,p_expected_version integer,p_reason text)
returns table(activity_id uuid,activity_version integer) language plpgsql security definer set search_path='' as $$
declare result record;
begin
  select * into result from public.restart_activity_legacy_v2(p_activity_id,p_expected_version,p_reason);
  update public.activities a set recording_modes=old.recording_modes from public.activities old where a.id=result.activity_id and old.id=p_activity_id;
  return query select result.activity_id,result.activity_version;
end $$;
revoke all on function public.restart_activity_v2(uuid,integer,text) from public,anon,authenticated,service_role;
grant execute on function public.restart_activity_v2(uuid,integer,text) to authenticated;
notify pgrst,'reload schema';
commit;
