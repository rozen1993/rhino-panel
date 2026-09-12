begin;
-- New contract: archive the previous execution and create a clean planned one.
-- The original and its external evidence remain recoverable until an explicit purge.
create function public.restart_activity_v2(p_activity_id uuid,p_expected_version integer,p_reason text)
returns table(activity_id uuid,activity_version integer)
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; item public.activities%rowtype; replacement uuid := gen_random_uuid();
begin
  perform pg_advisory_xact_lock(hashtextextended('sistema-r-account-administration',0));
  actor := private.require_admin_profile();
  if p_reason is null or char_length(btrim(p_reason)) not between 2 and 1000 then
    raise exception using errcode='SR003',message='restart reason required';
  end if;
  select * into item from public.activities where id=p_activity_id and deleted_at is null for update;
  if not found then raise exception using errcode='SR002',message='activity unavailable'; end if;
  if p_expected_version is null or item.version<>p_expected_version then
    raise exception using errcode='SR001',message='activity changed';
  end if;
  if item.status='Programada' or item.origin<>'operario' then
    raise exception using errcode='SR003',message='activity cannot be restarted';
  end if;
  perform 1 from public.profiles where id=item.responsible_id and is_active and role='operario' for share;
  if not found then raise exception using errcode='SR009',message='active responsible required'; end if;
  insert into public.activities(id,origin,created_by,created_by_role,responsible_id,responsible_name,type,title,description,place,reference_link)
  values(replacement,'operario',actor.id,'admin',item.responsible_id,item.responsible_name,item.type,item.title,item.description,item.place,item.reference_link);
  insert into public.activity_date_spans(activity_id,position,start_date,end_date,place)
  select replacement,position,start_date,end_date,place from public.activity_date_spans where activity_date_spans.activity_id=item.id;
  update public.activities set deleted_at=now(),deleted_by=actor.id,deletion_reason='Reinicio: '||left(btrim(p_reason),990),version=version+1,updated_at=now() where id=item.id;
  insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail) values
    (item.id,actor.id,actor.display_name,actor.role,'Ejecución anterior enviada a papelera',jsonb_build_object('motivo',btrim(p_reason),'nueva_actividad_id',replacement)),
    (replacement,actor.id,actor.display_name,actor.role,'Actividad reiniciada en Programada',jsonb_build_object('motivo',btrim(p_reason),'actividad_anterior_id',item.id));
  return query select replacement,1;
end $$;
revoke all on function public.restart_activity_v2(uuid,integer,text) from public,anon,authenticated,service_role;
grant execute on function public.restart_activity_v2(uuid,integer,text) to authenticated;
commit;
