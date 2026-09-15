-- Aunor is a read-only client. No rows, confirmations or evidence are removed.
-- Apply remotely only after obtaining a private, verified database backup.
begin;

create or replace function private.can_access_aunor_activity(target_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(private.current_app_role() in ('admin','aunor'), false)
    and exists (select 1 from public.activities a
      where a.id = target_id and a.deleted_at is null);
$$;

-- Explicit allowlist: no assignee, creator, operator opinion, conversation or audit.
-- History never expires. The main screen uses delivered_at, not updated_at.
create or replace view public.aunor_activities
with (security_invoker=false, security_barrier=true) as
select a.id, a.type, a.title, a.status, a.place,
  coalesce(nullif(p.summary,''), a.description) as summary, p.service_id,
  case when a.status='Entregada' then '' else coalesce(p.not_performed_reason,'') end as not_performed_reason,
  coalesce(p.version,0) as publication_version,
  coalesce(p.published_at,a.created_at) as published_at, 0::integer as unread_count,
  a.delivered_at,
  case when a.status='Entregada' then a.material_link else '' end as material_link
from public.activities a
left join private.aunor_publications p on p.activity_id=a.id
  and p.client_code='AUNOR' and p.superseded_at is null
where private.can_access_aunor_activity(a.id);

-- Preserve the existing Admin implementation privately. Reject client writes
-- before delegating, including retries of previously successful confirmations.
alter function public.aunor_mutate_v1(text,uuid,uuid,jsonb) set schema private;
revoke all on function private.aunor_mutate_v1(text,uuid,uuid,jsonb)
  from public,anon,authenticated,service_role;
create function public.aunor_mutate_v1(
  p_command text, p_activity_id uuid, p_request_id uuid, p_payload jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin_profile();
  if p_command is null or p_command not in ('publish','delivery','agreement','replacement') then
    raise exception using errcode='SR002', message='Aunor is read-only';
  end if;
  return private.aunor_mutate_v1(p_command,p_activity_id,p_request_id,p_payload);
end;
$$;
revoke all on function public.aunor_mutate_v1(text,uuid,uuid,jsonb)
  from public,anon,authenticated,service_role;
grant execute on function public.aunor_mutate_v1(text,uuid,uuid,jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
