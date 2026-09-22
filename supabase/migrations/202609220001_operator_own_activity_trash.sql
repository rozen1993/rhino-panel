begin;

-- New boundary; Admin deletion/restoration and all trash policies stay intact.
create function public.soft_delete_own_activity_v1(
  p_activity_id uuid,
  p_expected_version integer,
  p_reason text
)
returns table (activity_id uuid, activity_version integer, deleted_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  actor public.profiles%rowtype;
  item public.activities%rowtype;
  reason text := btrim(coalesce(p_reason, ''));
  deletion_moment timestamptz;
begin
  -- Same lock order as account administration and own planning. Authorization
  -- is checked AFTER waiting so revocation/deactivation cannot race this action.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sistema-r-account-administration', 0)
  );
  actor := private.require_operator_profile();
  if not actor.can_create_own_activities then
    raise exception using errcode = 'SR002', message = 'creation permission required';
  end if;
  if char_length(reason) not between 2 and 1000 then
    raise exception using errcode = 'SR003', message = 'invalid deletion reason';
  end if;
  select a.* into item from public.activities a where a.id = p_activity_id for update;
  if not found or item.deleted_at is not null or item.status <> 'Programada'
    or item.created_by is distinct from actor.id
    or item.created_by_role is distinct from 'operario'::public.app_role
    or item.responsible_id is distinct from actor.id then
    raise exception using errcode = 'SR002', message = 'only own assigned scheduled activities can be trashed';
  end if;
  if p_expected_version is null or item.version <> p_expected_version then
    raise exception using errcode = 'SR001', message = 'version conflict';
  end if;
  deletion_moment := now();
  update public.activities a
    set deleted_at = deletion_moment, deleted_by = actor.id, deletion_reason = reason,
        version = item.version + 1, updated_at = deletion_moment
    where a.id = item.id;
  insert into public.audit_events (activity_id, actor_id, actor_name, actor_role, action, detail)
    values (item.id, actor.id, actor.display_name, actor.role, 'Actividad propia enviada a Papelera',
      pg_catalog.jsonb_build_object('motivo', reason, 'estado', item.status, 'responsable_id', item.responsible_id));
  return query select item.id, item.version + 1, deletion_moment;
end;
$$;

revoke all on function public.soft_delete_own_activity_v1(uuid, integer, text)
  from public, anon, authenticated, service_role;
grant execute on function public.soft_delete_own_activity_v1(uuid, integer, text) to authenticated;
comment on function public.soft_delete_own_activity_v1(uuid, integer, text) is
  'Recoverable own deletion for authorized active operators; scheduled, authored and still assigned to actor. Preserves all content with atomic audit and version check. No trash management rights.';
commit;
