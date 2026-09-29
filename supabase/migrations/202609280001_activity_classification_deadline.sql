begin;
-- Additive changes only. No classification or completion backfill.
alter table public.activities
  add column classification text check (classification in ('standard','special')),
  add column delivery_due_on date check (delivery_due_on >= date '2026-01-01'),
  add column historical_regularized_at timestamptz,
  add column original_plan_options jsonb;
alter table public.activities drop constraint activities_description_check;
alter table public.activities add constraint activities_description_check check (
  char_length(btrim(description)) <= 5000 and (type='Edición' or char_length(btrim(description))>=2));
alter table public.activities drop constraint activities_delivery_complete;
alter table public.activities add constraint activities_delivery_complete check (
  (status='Entregada' and material_link<>'' and
    ((delivered_at is not null and historical_regularized_at is null) or
     (delivered_at is null and historical_regularized_at is not null))) or
  (status<>'Entregada' and delivered_at is null and historical_regularized_at is null));

-- The type-aware table constraint enforces mandatory descriptions outside Edición.
-- Retain all established date/URL validation in the shared helper.
do $$ declare definition text; begin
  select pg_get_functiondef('private.assert_activity_payload(text,text,jsonb,text)'::regprocedure) into definition;
  if position('char_length(btrim(payload_description)) not between 2 and 5000' in definition)=0 then
    raise exception 'Review payload validator before migration';
  end if;
  execute replace(definition,'char_length(btrim(payload_description)) not between 2 and 5000',
    'char_length(btrim(payload_description)) not between 0 and 5000');
end $$;

create function public.save_activity_plan_v4(
  p_activity_id uuid,p_expected_version integer,p_idempotency_key uuid,p_responsible_id uuid,
  p_type public.activity_type,p_title text,p_description text,p_place text,p_spans jsonb,
  p_recording_modes text[],p_delivery_due_on date,p_classification text)
returns table(activity_id uuid,activity_version integer,replayed boolean)
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; item public.activities%rowtype; result record;
  spans jsonb:=p_spans; description text:=p_description; place text:=p_place;
  options jsonb; was_replayed boolean:=false;
begin
  perform pg_advisory_xact_lock(hashtextextended('sistema-r-account-administration',0));
  if private.current_app_role()='admin' then actor:=private.require_admin_profile();
  else actor:=private.require_operator_profile(); end if;
  if p_classification is not null and (actor.role<>'admin' or p_classification not in ('standard','special')) then
    raise exception using errcode='SR002',message='classification is managed by Admin';
  end if;
  if p_type='Edición' and (p_delivery_due_on is null or p_delivery_due_on<date '2026-01-01') then
    raise exception using errcode='SR003',message='planned delivery date required';
  end if;
  if p_type<>'Edición' and p_delivery_due_on is not null then
    raise exception using errcode='SR003',message='deadline only applies to editing';
  end if;
  if p_activity_id is not null then
    select * into item from public.activities where id=p_activity_id for update;
    if not found then raise exception using errcode='SR002',message='activity unavailable'; end if;
    if p_type='Edición' then
      -- Hidden legacy fields are preserved server-side, not trusted to the client.
      description:=item.description; place:=item.place;
      select jsonb_agg(jsonb_build_object('start',s.start_date,'end',s.end_date,'place',s.place) order by s.position)
        into spans from public.activity_date_spans s where s.activity_id=item.id;
    end if;
  elsif p_type='Edición' then
    description:=''; place:='';
    spans:=jsonb_build_array(jsonb_build_object('start',p_delivery_due_on,'end',p_delivery_due_on,'place',''));
  end if;
  options:=jsonb_build_object('deadline',p_delivery_due_on,'classification',p_classification);
  if p_activity_id is null then
    if actor.role='admin' then
      select * into result from public.plan_activity_v3(p_idempotency_key,p_responsible_id,p_type,p_title,description,place,spans,p_recording_modes);
    else
      select * into result from public.create_own_activity_v3(p_idempotency_key,p_type,p_title,description,place,spans,p_recording_modes);
    end if;
    was_replayed:=result.replayed;
    if was_replayed then
      if (select a.original_plan_options from public.activities a where a.id=result.activity_id) is distinct from options then
        raise exception using errcode='SR006',message='plan options changed on replay';
      end if;
      return query select result.activity_id,result.activity_version,true; return;
    end if;
  elsif actor.role='admin' then
    select * into result from public.replan_activity_v3(p_activity_id,p_expected_version,p_responsible_id,p_type,p_title,description,place,spans,p_recording_modes);
  else
    select * into result from public.replan_own_activity_v3(p_activity_id,p_expected_version,p_type,p_title,description,place,spans,p_recording_modes);
  end if;
  update public.activities a set delivery_due_on=p_delivery_due_on,
    classification=case when actor.role='admin' then p_classification else a.classification end,
    original_plan_options=case when p_activity_id is null then options else a.original_plan_options end
    where a.id=result.activity_id;
  insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
    values(result.activity_id,actor.id,actor.display_name,actor.role,'Marcaje y fecha prevista registrados',
      jsonb_build_object('antes',jsonb_build_object('classification',item.classification,'deadline',item.delivery_due_on),'despues',options));
  return query select result.activity_id,result.activity_version,false;
end $$;

create function public.classify_activity_v1(p_activity_id uuid,p_expected_version integer,p_classification text)
returns void language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; item public.activities%rowtype;
begin
  actor:=private.require_admin_profile();
  if p_classification is not null and p_classification not in ('standard','special') then raise exception using errcode='SR003',message='invalid classification'; end if;
  select * into item from public.activities where id=p_activity_id and deleted_at is null for update;
  if not found then raise exception using errcode='SR002',message='activity unavailable'; end if;
  if p_expected_version is null or item.version<>p_expected_version then raise exception using errcode='SR001',message='version conflict'; end if;
  update public.activities set classification=p_classification,version=version+1,updated_at=now() where id=item.id;
  insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
    values(item.id,actor.id,actor.display_name,actor.role,'Clasificación actualizada',jsonb_build_object('antes',item.classification,'despues',p_classification));
end $$;

create function public.regularize_historical_activity_v1(p_activity_id uuid,p_expected_version integer,p_confirmed boolean)
returns void language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; item public.activities%rowtype; last_day date;
begin
  actor:=private.require_admin_profile();
  select * into item from public.activities where id=p_activity_id and deleted_at is null for update;
  if not found or item.origin<>'operario' then raise exception using errcode='SR002',message='activity unavailable'; end if;
  if p_expected_version is null or item.version<>p_expected_version then raise exception using errcode='SR001',message='version conflict'; end if;
  if item.status='Entregada' then raise exception using errcode='SR004',message='already delivered'; end if;
  select max(end_date) into last_day from public.activity_date_spans where activity_id=item.id;
  last_day:=coalesce(item.delivery_due_on,last_day);
  if p_confirmed is distinct from true or last_day is null or last_day>=(now() at time zone 'America/Lima')::date then
    raise exception using errcode='SR003',message='confirm completed historical work';
  end if;
  if not private.is_safe_https_url(item.material_link) or item.material_link='' then raise exception using errcode='SR005',message='final material required'; end if;
  update public.activities set status='Entregada',delivered_at=null,historical_regularized_at=now(),version=version+1,updated_at=now() where id=item.id;
  insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
    values(item.id,actor.id,actor.display_name,actor.role,'Entrega histórica regularizada',
      jsonb_build_object('estado_anterior',item.status,'fecha_real_entrega',null,'confirmacion_admin',true));
end $$;

create or replace view public.team_historical_activities with(security_barrier=true,security_invoker=false) as
select a.id,a.version,a.type,a.title,a.responsible_name,a.status,a.origin,a.description,a.place,a.material_link,a.operator_opinion,a.recording_modes,
  journeys.spans,
  coalesce(a.delivery_due_on,journeys.first_date) as first_date,coalesce(a.delivery_due_on,journeys.last_date) as last_date,
  a.classification,a.delivery_due_on,a.historical_regularized_at
from public.activities a cross join lateral (
  select jsonb_agg(jsonb_build_object('start',s.start_date,'end',s.end_date,'place',s.place) order by s.position,s.id) as spans,
    min(s.start_date) as first_date,max(s.end_date) as last_date from public.activity_date_spans s where s.activity_id=a.id
) journeys where a.deleted_at is null and private.current_app_role() in ('admin','operario');

-- Restart creates a fresh execution but retains the plan's classification/deadline.
alter function public.restart_activity_v2(uuid,integer,text) rename to restart_activity_modes_v2;
revoke all on function public.restart_activity_modes_v2(uuid,integer,text) from public,anon,authenticated,service_role;
create function public.restart_activity_v2(p_activity_id uuid,p_expected_version integer,p_reason text)
returns table(activity_id uuid,activity_version integer) language plpgsql security definer set search_path='' as $$
declare result record; begin
  select * into result from public.restart_activity_modes_v2(p_activity_id,p_expected_version,p_reason);
  update public.activities a set classification=old.classification,delivery_due_on=old.delivery_due_on
    from public.activities old where a.id=result.activity_id and old.id=p_activity_id;
  return query select result.activity_id,result.activity_version;
end $$;
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
    and p.proname in ('plan_activity_v3','create_own_activity_v3','replan_activity_v3','replan_own_activity_v3',
      'save_activity_plan_v4','classify_activity_v1','regularize_historical_activity_v1','restart_activity_v2') loop
    execute format('revoke all on function %s from public,anon,authenticated,service_role',f);
    if f::text not like '%_v3(%' then execute format('grant execute on function %s to authenticated',f); end if;
  end loop;
end $$;
notify pgrst,'reload schema';
commit;
