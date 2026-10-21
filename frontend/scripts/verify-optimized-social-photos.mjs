// Called only by the UUID-disposable SQL harness. Storage metadata stub is
// intentionally minimal: full Storage/Edge integration remains a separate gate.
import {randomUUID} from 'node:crypto';
export function verifyOptimizedSocialPhotos({sql,as,id,plan,migration}) {
 sql(`create schema storage;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,metadata jsonb);
 alter table storage.objects enable row level security;
 grant usage on schema storage to authenticated;
 grant select,insert,update,delete on storage.objects to authenticated;`);
 sql(migration);
 const key=randomUUID();
 sql(as(1,`select * from ${plan(key)};`));
 const activity=sql(`select id from public.activities where idempotency_key='${key}'`).trim();
 const photos=[randomUUID(),randomUUID(),randomUUID(),randomUUID()];
 const prepare=(i)=>`public.prepare_social_photo_v1('${activity}','${photos[i]}','${String(i+1).repeat(64)}','Foto sintética',1280,800,1200,200)`;
 const denied=(actor,expr,code='SR002')=>sql(as(actor,`do $$begin begin perform ${expr};raise exception 'Expected denial ${code}';exception when sqlstate '${code}' then null;end;end$$;`));
 denied(3,prepare(0));denied(4,prepare(0));
 sql(as(2,`select ${prepare(0)};select ${prepare(0)};`));
 sql(as(2,`do $$begin assert (public.social_storage_usage_v1()->>'used_bytes')::bigint=1400;end$$;`));
 denied(4,'public.social_storage_usage_v1()');
 sql(`select public.queue_erased_social_photo_upload_v1('${activity}','${photos[0]}');
 do $$begin assert(select count(*)=0 from private.social_photo_erasure_queue);end$$;`);
 sql(`do $$begin assert(select count(*)=1 from private.activity_social_photos where activity_id='${activity}');end$$;`);
 denied(2,`public.finish_social_photo_v1('${photos[0]}')`,'SR014');
 sql(as(4,`do $$begin assert(select count(*)=0 from public.activity_social_photos);end$$;`));
 sql(`insert into storage.objects(bucket_id,name,metadata) values
 ('activity-social-photos','${activity}/${photos[0]}/image.jpg','{"size":1200}'),
 ('activity-social-photos','${activity}/${photos[0]}/thumb.webp','{"size":200}');`);
 sql(as(2,`select public.finish_social_photo_v1('${photos[0]}');select public.finish_social_photo_v1('${photos[0]}');`));
 sql(as(4,`do $$begin assert(select count(*)=1 from public.activity_social_photos);assert(select count(*)=2 from storage.objects);
 assert not exists(select 1 from information_schema.columns where table_schema='public' and table_name='activity_social_photos' and column_name in ('uploaded_by','digest'));end$$;`));
 sql(as(3,`do $$begin assert(select count(*)=0 from public.activity_social_photos);assert(select count(*)=0 from storage.objects);end$$;`));
 // No direct Storage writes, even for the responsible operator.
 denied(2,`(select count(*) from private.activity_social_photos)`,'42501');
 sql(as(2,`do $$begin begin insert into storage.objects(bucket_id,name) values('activity-social-photos','forbidden');raise exception 'Expected Storage denial';exception when insufficient_privilege then null;end;end$$;`));
 sql(as(1,`select ${prepare(1)};select ${prepare(2)};`));
 denied(2,prepare(3),'SR013');
 denied(2,`public.set_social_photo_archived_v1('${photos[0]}',1,true)`,'SR001');
 sql(as(2,`select public.set_social_photo_archived_v1('${photos[0]}',2,true);`));
 sql(as(4,`do $$begin assert(select count(*)=0 from public.activity_social_photos);assert(select count(*)=0 from storage.objects);end$$;`));
 sql(as(2,`select ${prepare(3)};`));
 denied(1,`public.set_social_photo_archived_v1('${photos[0]}',3,false)`,'SR013');
 sql(as(1,`select public.set_social_photo_archived_v1('${photos[3]}',1,true);select public.set_social_photo_archived_v1('${photos[0]}',3,false);`));
 // Archived photos and pending reservations still consume the safety budget.
 sql(as(1,`select public.set_social_photo_archived_v1('${photos[2]}',1,true);
 do $$begin assert (public.social_storage_usage_v1()->>'used_bytes')::bigint=5600;end$$;`));
 sql(`insert into storage.buckets(id,name,public) values('synthetic-quota','synthetic-quota',false);
 insert into storage.objects(bucket_id,name,metadata) values('synthetic-quota','quota-synthetic','{"size":899999999}');`);
 denied(2,`public.prepare_social_photo_v1('${activity}','${randomUUID()}','${'f'.repeat(64)}','Límite sintético',1280,800,1200,200)`,'SR015');
 sql(as(1,`do $$begin assert (public.social_storage_usage_v1()->>'warning')::boolean;end$$;`));
 sql(`delete from storage.objects where bucket_id='synthetic-quota';delete from storage.buckets where id='synthetic-quota';`);
 denied(2,`public.prepare_social_photo_v1('${activity}','${randomUUID()}','${'e'.repeat(64)}','Límite sintético',1280,800,614401,200)`,'SR003');
 sql(as(1,`select public.set_social_photo_archived_v1('${photos[2]}',2,false);`));
 sql(`do $$begin assert(select count(*)=4 from private.activity_social_photos where activity_id='${activity}');
 assert(select status='Programada' from public.activities where id='${activity}');
 assert(select count(*)=1 from public.audit_events where activity_id='${activity}' and action='Foto para redes añadida');
 assert not has_function_privilege('anon','public.prepare_social_photo_v1(uuid,uuid,text,text,integer,integer,integer,integer)','execute');
 assert not has_function_privilege('authenticated','public.pending_social_photo_erasure_v1()','execute');
 assert not has_function_privilege('authenticated','public.queue_erased_social_photo_upload_v1(uuid,uuid)','execute');
 assert(select not public from storage.buckets where id='activity-social-photos');end$$;`);
 // Revoked sessions and trashed activities must lose both metadata and bytes.
 sql(`update public.app_sessions set revoked_at=now() where session_id='${id(204)}';`);
 sql(as(4,`do $$begin assert(select count(*)=0 from public.activity_social_photos);assert(select count(*)=0 from storage.objects);end$$;`));
 sql(`update public.app_sessions set revoked_at=null where session_id='${id(204)}';`);
 sql(as(1,`select public.soft_delete_activity_v1('${activity}',1,'Prueba aislada de permisos');`));
 sql(as(4,`do $$begin assert(select count(*)=0 from public.activity_social_photos);assert(select count(*)=0 from storage.objects);end$$;`));
 denied(2,prepare(0));
 sql(`do $$declare manifest name;summary jsonb;begin
 begin delete from private.activity_social_photos where id='${photos[0]}';raise exception 'Expected physical-delete denial';exception when sqlstate 'SR012' then null;end;
 manifest:=private.build_erasure_manifest('trash',null);summary:=private.erasure_summary(manifest);
 assert (summary->'counts'->>'private.activity_social_photos')::int=4;
 perform private.apply_erasure(manifest);
 assert(select count(*)=4 from private.social_photo_erasure_queue);
 assert(select count(*)=2 from storage.objects); -- Storage API, never SQL deletion.
 assert not exists(select 1 from private.activity_social_photos where activity_id='${activity}');
 end$$;`);
 sql(`select public.ack_social_photo_erasure_v1(array['${photos[0]}']::uuid[]);
 select public.queue_erased_social_photo_upload_v1('${activity}','${photos[0]}');
 do $$begin assert(select count(*)=4 from private.social_photo_erasure_queue);end$$;`);
 console.log('PASS photo SQL: private bucket, roles, no operator disclosure, max-three, retries, stale versions, recoverable archive, session/trash denial, activity status preserved');
}
