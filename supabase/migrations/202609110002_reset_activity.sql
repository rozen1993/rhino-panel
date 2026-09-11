begin;
create function public.reset_activity_v1(p_activity_id uuid,p_expected_version integer,p_reason text)
returns table(activity_id uuid,activity_version integer)
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; item public.activities%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended('sistema-r-account-administration',0));
  actor := private.require_admin_profile();
  if p_reason is null or char_length(btrim(p_reason)) not between 2 and 1000 then
    raise exception using errcode='SR003',message='reset reason required';
  end if;
  select * into item from public.activities where id=p_activity_id and deleted_at is null for update;
  if not found then raise exception using errcode='SR002',message='activity unavailable'; end if;
  if p_expected_version is null or item.version<>p_expected_version then
    raise exception using errcode='SR001',message='activity changed';
  end if;
  if item.status='Programada' then raise exception using errcode='SR003',message='already scheduled'; end if;
  -- Keep material, opinion, thread and all external evidence. Previous delivery
  -- timestamp is retained in the audit, while the active execution restarts.
  update public.activities set status='Programada',delivered_at=null,version=version+1,updated_at=now() where id=item.id;
  insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
  values(item.id,actor.id,actor.display_name,actor.role,'Actividad restablecida a Programada',
    jsonb_build_object('motivo',btrim(p_reason),'estado_anterior',item.status,'entregada_en_anterior',item.delivered_at));
  return query select item.id,item.version+1;
end $$;
revoke all on function public.reset_activity_v1(uuid,integer,text) from public,anon,authenticated,service_role;
grant execute on function public.reset_activity_v1(uuid,integer,text) to authenticated;
commit;
