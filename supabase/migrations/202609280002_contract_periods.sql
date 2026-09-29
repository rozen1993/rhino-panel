begin;
-- Quotas are period-specific and explicitly confirmed by Admin. No historical
-- activity is assigned to a period by this migration, and no quota is invented.
create table private.aunor_contract_periods (
 id uuid primary key default gen_random_uuid(),
 service_id text not null references private.aunor_services(id),
 cadence text not null check(cadence in ('monthly','annual')),
 starts_on date not null check(starts_on>=date '2026-01-01'),
 ends_on date not null,
 target integer check(target between 1 and 1000000),
 version integer not null default 1,
 check(ends_on>=starts_on and ends_on-starts_on<=366),
 check(cadence<>'monthly' or date_trunc('month',starts_on)=date_trunc('month',ends_on)),
 unique(service_id,starts_on,ends_on)
);
create table private.aunor_contract_period_events (
 id bigint generated always as identity primary key,
 period_id uuid not null references private.aunor_contract_periods(id),
 recorded_at timestamptz not null default now(),
 actor_id uuid references public.profiles(id) on delete set null,
 before_value jsonb, after_value jsonb not null
);
alter table private.aunor_contract_periods enable row level security;
alter table private.aunor_contract_period_events enable row level security;
revoke all on private.aunor_contract_periods,private.aunor_contract_period_events from public,anon,authenticated,service_role;
alter table public.activities add column contract_period_id uuid references private.aunor_contract_periods(id);

-- Changing service must not resurrect an old assignment on a later publication.
create function private.invalidate_contract_assignment() returns trigger
language plpgsql security definer set search_path='' as $$
declare item public.activities%rowtype;
begin
 select * into item from public.activities where id=new.activity_id for update;
 if item.contract_period_id is not null and not exists(select 1 from private.aunor_contract_periods p where p.id=item.contract_period_id and p.service_id=new.service_id) then
   update public.activities set contract_period_id=null,version=version+1,updated_at=now() where id=item.id;
   insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
     select item.id,p.id,p.display_name,p.role,'Periodo pendiente por cambio de servicio',jsonb_build_object('periodo_anterior',item.contract_period_id,'servicio_nuevo',new.service_id)
     from public.profiles p where p.id=new.recorded_by;
 end if;
 return new;
end $$;
revoke all on function private.invalidate_contract_assignment() from public,anon,authenticated,service_role;
create trigger invalidate_contract_assignment after insert on private.aunor_publications
for each row when (new.superseded_at is null) execute function private.invalidate_contract_assignment();

create view public.aunor_contract_periods with(security_invoker=false,security_barrier=true) as
select p.* from private.aunor_contract_periods p where private.current_app_role() in ('admin','aunor');
revoke all on public.aunor_contract_periods from public,anon,authenticated,service_role;
grant select on public.aunor_contract_periods to authenticated;

create function public.configure_contract_period_v1(p_period_id uuid,p_expected_version integer,p_service_id text,p_cadence text,p_starts_on date,p_ends_on date,p_target integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; previous private.aunor_contract_periods%rowtype; result private.aunor_contract_periods%rowtype;
begin
 actor:=private.require_admin_profile();
 perform pg_advisory_xact_lock(hashtextextended('sistema-r-contract-periods',0));
 if p_service_id is null or not exists(select 1 from private.aunor_services where id=p_service_id)
   or p_cadence is null or p_cadence not in ('monthly','annual') or p_starts_on is null or p_ends_on is null
   or p_starts_on<date '2026-01-01' or p_ends_on<p_starts_on or p_ends_on-p_starts_on>366
   or (p_target is not null and p_target not between 1 and 1000000)
   or (p_cadence='monthly' and date_trunc('month',p_starts_on)<>date_trunc('month',p_ends_on)) then
   raise exception using errcode='SR003',message='invalid contractual period';
 end if;
 if exists(select 1 from private.aunor_contract_periods p where p.service_id=p_service_id
   and p.id is distinct from p_period_id and p.starts_on<=p_ends_on and p.ends_on>=p_starts_on) then
   raise exception using errcode='SR003',message='overlapping contractual periods';
 end if;
 if p_period_id is null then
   insert into private.aunor_contract_periods(service_id,cadence,starts_on,ends_on,target)
     values(p_service_id,p_cadence,p_starts_on,p_ends_on,p_target) returning * into result;
 else
   select * into previous from private.aunor_contract_periods where id=p_period_id for update;
   if not found or p_expected_version is null or previous.version<>p_expected_version then raise exception using errcode='SR001',message='period changed'; end if;
   -- Never move previously assigned work by silently changing period boundaries.
   if previous.service_id<>p_service_id or previous.starts_on<>p_starts_on or previous.ends_on<>p_ends_on or previous.cadence<>p_cadence then
     raise exception using errcode='SR003',message='period boundaries are immutable';
   end if;
   update private.aunor_contract_periods set target=p_target,version=version+1 where id=previous.id returning * into result;
 end if;
 insert into private.aunor_contract_period_events(period_id,actor_id,before_value,after_value)
   values(result.id,actor.id,case when previous.id is null then null else to_jsonb(previous) end,to_jsonb(result));
 return result.id;
end $$;

create function public.assign_contract_period_v1(p_activity_id uuid,p_expected_version integer,p_publication_version integer,p_period_id uuid,p_confirmed boolean)
returns void language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; item public.activities%rowtype; publication private.aunor_publications%rowtype;
begin
 actor:=private.require_admin_profile();
 select * into item from public.activities where id=p_activity_id and deleted_at is null for update;
 if not found or item.origin<>'operario' then raise exception using errcode='SR002',message='activity unavailable'; end if;
 if p_expected_version is null or item.version<>p_expected_version then raise exception using errcode='SR001',message='activity changed'; end if;
 if p_confirmed is distinct from true then raise exception using errcode='SR003',message='explicit period confirmation required'; end if;
 select * into publication from private.aunor_publications where activity_id=item.id and client_code='AUNOR' and superseded_at is null;
 if not found or p_publication_version is null or publication.version<>p_publication_version then raise exception using errcode='SR001',message='publication changed'; end if;
 if p_period_id is not null and not exists(select 1 from private.aunor_contract_periods where id=p_period_id and service_id=publication.service_id) then
   raise exception using errcode='SR003',message='period must match current service';
 end if;
 update public.activities set contract_period_id=p_period_id,version=version+1,updated_at=now() where id=item.id;
 insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
   values(item.id,actor.id,actor.display_name,actor.role,'Periodo contractual confirmado',jsonb_build_object('antes',item.contract_period_id,'despues',p_period_id,'servicio',publication.service_id));
end $$;

create or replace view public.aunor_activities with(security_invoker=false,security_barrier=true) as
select a.id,a.type,a.title,a.status,a.place,coalesce(nullif(p.summary,''),a.description) as summary,p.service_id,
 coalesce(p.not_performed_reason,'') as not_performed_reason,
 coalesce(p.version,0) as publication_version,coalesce(p.published_at,a.created_at) as published_at,0::integer as unread_count,
 a.delivered_at,case when a.status='Entregada' then a.material_link else '' end as material_link,a.recording_modes,
 a.classification,a.delivery_due_on,a.historical_regularized_at,
 case when cp.service_id=p.service_id then a.contract_period_id else null end as contract_period_id
from public.activities a
left join private.aunor_publications p on p.activity_id=a.id and p.client_code='AUNOR' and p.superseded_at is null
left join private.aunor_contract_periods cp on cp.id=a.contract_period_id
where private.can_access_aunor_activity(a.id);

revoke all on function public.configure_contract_period_v1(uuid,integer,text,text,date,date,integer),public.assign_contract_period_v1(uuid,integer,integer,uuid,boolean) from public,anon,authenticated,service_role;
grant execute on function public.configure_contract_period_v1(uuid,integer,text,text,date,date,integer),public.assign_contract_period_v1(uuid,integer,integer,uuid,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
