// UUID-disposable SQL harness only. No real activity, account or folder access.
import {randomUUID} from 'node:crypto';
export function verifySocialPhotos({sql,as,id,plan,migration}) {
 sql(migration);
 const key=randomUUID();sql(as(1,`select * from ${plan(key)};`));
 const activity=sql(`select id from public.activities where idempotency_key='${key}'`).trim();
 const url='https://example-my.sharepoint.com/:f:/g/personal/synthetic/Folder';
 const save=(version=0,link=url)=>`public.save_social_folder_v1('${activity}','${link}',${version})`;
 const denied=(actor,expr,code='SR002')=>sql(as(actor,`do $$begin begin perform ${expr};raise exception 'Expected denial ${code}';exception when sqlstate '${code}' then null;end;end$$;`));
 denied(3,save());denied(4,save());
 for(const invalid of ['http://1drv.ms/f/a','https://evil.example/f/a','https://1drv.ms.evil.example/f/a','https://1drv.ms@evil.example/f/a','https://1drv.ms/','https://1drv.ms:8443/f/a'])denied(2,save(0,invalid),'SR003');
 sql(as(2,`select ${save()};select ${save()};`));
 sql(`do $$begin assert(select count(*)=1 from private.activity_social_folders where activity_id='${activity}');
 assert(select count(*)=1 from public.audit_events where activity_id='${activity}' and action='Carpeta Social vinculada');end$$;`);
 sql(as(4,`do $$begin assert(select count(*)=1 from public.activity_social_folders where activity_id='${activity}');
 assert not exists(select 1 from information_schema.columns where table_schema='public' and table_name='activity_social_folders' and column_name in ('updated_by','responsible_id'));end$$;`));
 sql(as(3,`do $$begin assert(select count(*)=0 from public.activity_social_folders where activity_id='${activity}');end$$;`));
 denied(2,'(select count(*) from private.activity_social_folders)','42501');
 sql(as(4,`do $$begin begin update public.activity_social_folders set folder_url='https://1drv.ms/f/forbidden' where activity_id='${activity}';raise exception 'Expected direct-write denial';exception when insufficient_privilege then null;end;end$$;`));
 denied(1,save(0,'https://1drv.ms/f/new'),'SR001');
 sql(as(1,`select ${save(1,'https://1drv.ms/f/new')};`));
 denied(2,save(1),'SR001');
 sql(`do $$begin assert(select version=2 from private.activity_social_folders where activity_id='${activity}');
 assert(select status='Programada' from public.activities where id='${activity}');
 assert(select count(*)=2 from private.record_history where table_name='private.activity_social_folders' and new_record->>'activity_id'='${activity}');
 assert not has_function_privilege('anon','public.save_social_folder_v1(uuid,text,integer)','execute');end$$;`);
 sql(`update public.app_sessions set revoked_at=now() where session_id in ('${id(204)}','${id(202)}');`);
 sql(as(4,`do $$begin assert(select count(*)=0 from public.activity_social_folders);end$$;`));denied(2,save(2));
 sql(`update public.app_sessions set revoked_at=null where session_id in ('${id(204)}','${id(202)}');`);
 sql(as(1,`select public.soft_delete_activity_v1('${activity}',1,'Prueba aislada de permisos');`));
 sql(as(4,`do $$begin assert(select count(*)=0 from public.activity_social_folders where activity_id='${activity}');end$$;`));denied(2,save(2));
 sql(`do $$declare manifest name;summary jsonb;begin
 begin delete from private.activity_social_folders where activity_id='${activity}';raise exception 'Expected delete denial';exception when sqlstate 'SR012' then null;end;
 manifest:=private.build_erasure_manifest('trash',null);summary:=private.erasure_summary(manifest);
 assert (summary->'counts'->>'private.activity_social_folders')::int=1;
 perform private.apply_erasure(manifest);
 assert not exists(select 1 from private.activity_social_folders where activity_id='${activity}');end$$;`);
 console.log('PASS Social SQL: OneDrive allowlist, read-only Aunor, assigned operator, stale versions, retry, audit, revoked-session/trash denial, metadata-only erasure');
}
