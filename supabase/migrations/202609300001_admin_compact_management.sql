begin;
-- Atomic composition of existing audited operations; no changes to real records.
create function public.save_admin_activity_bundle_v1(p_command text,p_activity_id uuid,p_request_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor public.profiles%rowtype;
 item public.activities%rowtype;
 prior private.aunor_requests%rowtype;
 fingerprint text;
 result jsonb;
 publication jsonb;
 agreement jsonb;
 original_id uuid;
 period_id uuid;
 next_version integer;
begin
 actor:=private.require_admin_profile();
 -- Same lock order as the existing channel: channel, then activity rows.
 perform pg_advisory_xact_lock(hashtextextended('sistema-r-aunor-channel-v1',0));
 if p_command is null or p_command not in ('relation','replacement') or p_activity_id is null or p_request_id is null
   or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>24000 then
   raise exception using errcode='SR003',message='invalid compact management request';
 end if;
 fingerprint:=md5(jsonb_build_array('admin-bundle',p_command,p_activity_id,p_payload)::text);
 select * into prior from private.aunor_requests where actor_id=actor.id and request_id=p_request_id;
 if found then
   if prior.fingerprint<>fingerprint then raise exception using errcode='SR006',message='request key reused'; end if;
   return prior.result;
 end if;
 if p_command='replacement' then original_id:=nullif(p_payload->>'originalId','')::uuid; end if;
 perform a.id from public.activities a where a.id in(p_activity_id,original_id) order by a.id for update;
 select * into item from public.activities where id=p_activity_id and deleted_at is null and origin='operario';
 if not found then raise exception using errcode='SR002',message='activity unavailable'; end if;
 if (p_payload->>'activityVersion')::integer is distinct from item.version then
   raise exception using errcode='SR001',message='activity changed';
 end if;
 if p_command='relation' then
   if p_payload->'confirmed' is distinct from 'true'::jsonb then raise exception using errcode='SR003',message='explicit confirmation required'; end if;
   period_id:=nullif(p_payload->>'periodId','')::uuid;
   if period_id is not null and not exists(select 1 from private.aunor_contract_periods where id=period_id and service_id=p_payload->>'serviceId') then
     raise exception using errcode='SR003',message='period must match selected service';
   end if;
   publication:=public.aunor_mutate_v1('publish',item.id,gen_random_uuid(),jsonb_build_object(
     'expectedVersion',p_payload->'publicationVersion','summary',p_payload->>'summary',
     'serviceId',p_payload->>'serviceId','notPerformedReason',p_payload->>'notPerformedReason'));
   -- Publishing a different service can invalidate the previous assignment and bump version.
   select version into next_version from public.activities where id=item.id;
   perform public.assign_contract_period_v1(item.id,next_version,(publication->>'version')::integer,period_id,true);
   result:=publication;
 else
   if original_id is null or original_id=item.id or not private.can_access_aunor_activity(original_id) then
     raise exception using errcode='SR002',message='original unavailable';
   end if;
   if exists(select 1 from private.aunor_replacements r where r.original_activity_id=original_id
     and not exists(select 1 from private.aunor_replacements n where n.corrects_id=r.id)) then
     raise exception using errcode='SR001',message='original already replaced; use correction flow';
   end if;
   if nullif(p_payload->>'agreementId','') is not null then
     if not exists(select 1 from private.aunor_agreements g where g.id=(p_payload->>'agreementId')::uuid
       and g.activity_id in(original_id,item.id) and not exists(select 1 from private.aunor_agreements n where n.corrects_id=g.id)) then
       raise exception using errcode='SR001',message='agreement changed';
     end if;
     agreement:=jsonb_build_object('id',p_payload->>'agreementId');
   else
     agreement:=public.aunor_mutate_v1('agreement',original_id,gen_random_uuid(),jsonb_build_object(
       'channel',p_payload->>'channel','contactedAt',p_payload->>'contactedAt','requesterDeclared',p_payload->>'requesterDeclared',
       'body',p_payload->>'reason','evidenceLink',p_payload->>'evidenceLink'));
   end if;
   result:=public.aunor_mutate_v1('replacement',original_id,gen_random_uuid(),jsonb_build_object(
     'substituteId',item.id,'agreementId',agreement->>'id','reason',p_payload->>'reason',
     'evidenceNote',p_payload->>'reason','evidenceLink',p_payload->>'evidenceLink'));
 end if;
 insert into private.aunor_requests(actor_id,request_id,fingerprint,result) values(actor.id,p_request_id,fingerprint,result);
 return result;
end $$;
revoke all on function public.save_admin_activity_bundle_v1(text,uuid,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.save_admin_activity_bundle_v1(text,uuid,uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
