-- Read-only performance change. No stored business data or grants are changed.
-- Apply remotely only after a private backup has been restored and verified.
begin;

-- current_app_role still checks profile, password rotation and active session.
-- Evaluate it once per statement, not once per historical row. The deleted-row
-- check is explicit; no per-row security-definer lookup of the same activity.
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
where (select private.current_app_role()) in ('admin','aunor') and a.deleted_at is null;

create or replace view public.aunor_journeys with(security_invoker=false,security_barrier=true) as
select s.activity_id,s.position,s.start_date,s.end_date,s.place
from public.activity_date_spans s
join public.activities a on a.id=s.activity_id
where (select private.current_app_role()) in ('admin','aunor') and a.deleted_at is null;

create or replace view public.aunor_services with(security_invoker=false,security_barrier=true) as
select s.id,s.position,s.label,s.reference from private.aunor_services s
where (select private.current_app_role()) in ('admin','aunor');

create or replace view public.aunor_contract_periods with(security_invoker=false,security_barrier=true) as
select p.* from private.aunor_contract_periods p
where (select private.current_app_role()) in ('admin','aunor');

notify pgrst,'reload schema';
commit;
