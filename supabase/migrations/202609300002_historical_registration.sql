begin;
-- Additive RPC only: no changes to existing activities, accounts or contract quotas.
create function public.register_historical_activity_v1(p_request_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor public.profiles%rowtype;
 prior private.aunor_requests%rowtype;
 fingerprint text;
 planned record;
 result jsonb;
 kind public.activity_type;
 deadline date;
 last_day date;
 material text;
 service text;
 modes text[];
begin
 actor:=private.require_admin_profile();
 perform pg_advisory_xact_lock(hashtextextended('sistema-r-account-administration',0));
 perform pg_advisory_xact_lock(hashtextextended('sistema-r-aunor-channel-v1',0));
 if p_request_id is null or p_payload is null or jsonb_typeof(p_payload)<>'object'
   or octet_length(p_payload::text)>60000 or p_payload->'confirmed' is distinct from 'true'::jsonb then
   raise exception using errcode='SR003',message='confirm completed historical work';
 end if;
 fingerprint:=md5(jsonb_build_array('historical-registration',p_payload)::text);
 select * into prior from private.aunor_requests where actor_id=actor.id and request_id=p_request_id;
 if found then
   if prior.fingerprint<>fingerprint then raise exception using errcode='SR006',message='request key reused';end if;
   return prior.result;
 end if;
 kind:=(p_payload->>'type')::public.activity_type;
 deadline:=nullif(p_payload->>'deliveryDueOn','')::date;
 material:=btrim(coalesce(p_payload->>'materialLink',''));
 service:=nullif(p_payload->>'serviceId','');
 if kind is null or p_payload->>'classification' is null or p_payload->>'classification' not in ('standard','special')
   or not private.is_safe_https_url(material) or material='' then
   raise exception using errcode='SR003',message='classification and final material required';
 end if;
 if service is not null and not exists(select 1 from private.aunor_services where id=service) then
   raise exception using errcode='SR003',message='contract service unavailable';
 end if;
 select coalesce(array_agg(value),'{}'::text[]) into modes from jsonb_array_elements_text(p_payload->'recordingModes');
 select * into planned from public.save_activity_plan_v4(null,null,p_request_id,
   (p_payload->>'responsibleAccountId')::uuid,kind,p_payload->>'title',p_payload->>'description',p_payload->>'placeName',
   p_payload->'spans',modes,deadline,p_payload->>'classification');
 -- A key belonging to an ordinary plan must never convert that existing work.
 if planned.replayed then raise exception using errcode='SR006',message='request belongs to another workflow';end if;
 select coalesce(deadline,max(end_date)) into last_day from public.activity_date_spans where activity_id=planned.activity_id;
 if last_day is null or last_day>=(now() at time zone 'America/Lima')::date then
   raise exception using errcode='SR003',message='historical date must be in the past';
 end if;
 -- Final state is committed atomically. No fictional start, operator opinion or delivery timestamp.
 update public.activities set material_link=material,status='Entregada',delivered_at=null,
   historical_regularized_at=now(),version=version+1,updated_at=now() where id=planned.activity_id;
 insert into public.audit_events(activity_id,actor_id,actor_name,actor_role,action,detail)
   values(planned.activity_id,actor.id,actor.display_name,actor.role,'Trabajo histórico registrado',
     jsonb_build_object('confirmacion_admin',true,'fecha_referencia',last_day,'tipo',kind,'servicio',service));
 perform public.aunor_mutate_v1('publish',planned.activity_id,gen_random_uuid(),jsonb_build_object(
   'expectedVersion',0,'summary',case when kind='Edición' then btrim(p_payload->>'title') else btrim(p_payload->>'description') end,
   'serviceId',coalesce(service,''),'notPerformedReason',''));
 result:=jsonb_build_object('activityId',planned.activity_id);
 insert into private.aunor_requests(actor_id,request_id,fingerprint,result) values(actor.id,p_request_id,fingerprint,result);
 return result;
end $$;
revoke all on function public.register_historical_activity_v1(uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.register_historical_activity_v1(uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
