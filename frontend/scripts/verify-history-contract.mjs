// No environment credentials, resets, or existing database writes. Disposable UUID DB only.
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const container=process.env.SISTEMA_R_TEST_DB_CONTAINER || 'supabase_db_sistema-r';
if(!/^[a-zA-Z0-9_-]+$/.test(container))throw Error('Invalid disposable test container');
const database='sr_history_test_'+randomUUID().replaceAll('-','');
const migrations=fileURLToPath(new URL('../../supabase/migrations/',import.meta.url));
function run(args,input){const r=spawnSync('docker',['exec',...(input?['-i']:[]),container,...args],{input,encoding:'utf8',windowsHide:true});if(r.error||r.status!==0)throw Error(r.error?.message||r.stderr||r.stdout);return r.stdout;}
const sql=input=>run(['psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d',database],input);
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const as=(n,body)=>`begin;set local role authenticated;select set_config('request.jwt.claims','${JSON.stringify({sub:id(100+n),session_id:id(200+n),role:'authenticated'})}',true);${body}commit;`;
const deny=(n,expression,code='SR002')=>sql(as(n,`do $$ begin begin perform ${expression};raise exception 'Expected ${code}';exception when sqlstate '${code}' then null;end;end $$;`));
const plan=(key,type='Grabación',deadline='null',classification='null',activity='null',version='null')=>`public.save_activity_plan_v4(${activity},${version},'${key}','${id(102)}','${type}','Trabajo sintético','Descripción que no se pierde','Lugar original','[{"start":"2026-04-12","end":"2026-04-12","place":"Lugar jornada"}]',${type==='Grabación'?"array['Video']":"'{}'::text[]"},${deadline},${classification})`;
let created=false;
try {
 run(['createdb','-U','postgres','--template=template0','--owner=postgres',database]);created=true;
 console.log('Disposable database: '+database);
 sql(`create schema extensions;create schema auth;create table auth.users(id uuid primary key);
 create function auth.jwt() returns jsonb language sql stable set search_path='' as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
 create function auth.uid() returns uuid language sql stable set search_path='' as $$select nullif(auth.jwt()->>'sub','')::uuid$$;
 grant usage on schema public,auth,extensions to anon,authenticated,service_role;
 revoke all on function auth.jwt(),auth.uid() from public;grant execute on function auth.jwt(),auth.uid() to anon,authenticated,service_role;`);
 const files=readdirSync(migrations).filter(f=>f.endsWith('.sql')).sort();
 if(files.at(-1)!=='202609300001_admin_compact_management.sql')throw Error('Review migration boundary');
 for(const f of files)sql(readFileSync(migrations+'/'+f,'utf8'));
 console.log('PASS complete migration chain');
 sql(`insert into auth.users values ${[1,2,3,4].map(n=>`('${id(100+n)}')`).join(',')};
 insert into public.profiles(id,username,display_name,role,can_create_own_activities) values
 ('${id(101)}','test.admin','Admin','admin',false),('${id(102)}','test.creator','Creator','operario',true),
 ('${id(103)}','test.other','Other','operario',true),('${id(104)}','test.aunor','Aunor','aunor',false);
 insert into public.app_sessions(session_id,user_id) values ${[1,2,3,4].map(n=>`('${id(200+n)}','${id(100+n)}')`).join(',')};`);
 const key=randomUUID();sql(as(1,`select * from ${plan(key)};`));
 const a=sql(`select id from public.activities where idempotency_key='${key}';`).trim();
 deny(2,`public.classify_activity_v1('${a}',1,'special')`);deny(4,`public.classify_activity_v1('${a}',1,'special')`);
 sql(as(1,`select public.classify_activity_v1('${a}',1,'special');`));
 deny(1,`public.classify_activity_v1('${a}',1,'standard')`,'SR001');
 sql(as(1,`select * from ${plan(key)};`)); // retry is based on original options, not current marking
 deny(1,plan(key,'Grabación','null',"'standard'"),'SR006');
 deny(2,plan(randomUUID(),'Grabación','null',"'special'"));
 deny(1,`public.regularize_historical_activity_v1('${a}',2,true)`,'SR005');
 sql(as(2,`select public.update_execution_v1('${a}',2,'https://example.invalid/final','Opinión original');`));
 deny(2,`public.regularize_historical_activity_v1('${a}',3,true)`);
 deny(1,`public.regularize_historical_activity_v1('${a}',3,false)`,'SR003');
 sql(as(1,`select public.regularize_historical_activity_v1('${a}',3,true);`));
 sql(`do $$begin assert(select status='Entregada' and version=4 and delivered_at is null and historical_regularized_at is not null and classification='special' and material_link='https://example.invalid/final' and operator_opinion='Opinión original' from public.activities where id='${a}');
 assert(select start_date='2026-04-12' and place='Lugar jornada' from public.activity_date_spans where activity_id='${a}');
 assert exists(select 1 from public.audit_events where activity_id='${a}' and action='Entrega histórica regularizada');end $$;`);
 sql(as(4,`do $$begin assert(select classification='special' and historical_regularized_at is not null from public.aunor_activities where id='${a}');assert(select count(*)=0 from public.activities);end $$;`));
 sql(`do $$begin assert not exists(select 1 from information_schema.columns where table_name='aunor_activities' and column_name in ('responsible_id','responsible_name','created_by'));end $$;`);
 console.log('PASS classification, stale versions, historical completion preserves material/spans, Aunor privacy');
 const editKey=randomUUID();sql(as(2,`select * from ${plan(editKey,'Edición',"'2026-04-15'")};`));
 const e=sql(`select id from public.activities where idempotency_key='${editKey}';`).trim();
 sql(`do $$begin assert(select description='' and place='' and delivery_due_on='2026-04-15' from public.activities where id='${e}');end $$;`);
 deny(2,plan(randomUUID(),'Edición'),'SR003');
 sql(as(2,`select * from ${plan(editKey,'Edición',"'2026-05-15'",'null',`'${e}'`,'1')};`));
 sql(`do $$begin assert(select start_date='2026-04-15' from public.activity_date_spans where activity_id='${e}');end $$;`);
 sql(as(3,`do $$begin assert(select first_date='2026-05-15' from public.team_historical_activities where id='${e}');end $$;`));
 const periodCall=`public.configure_contract_period_v1(null,null,'cobertura','monthly','2026-04-01','2026-04-30',10)`;
 deny(4,periodCall);sql(as(1,`select ${periodCall};`));
 const p=sql(`select id from private.aunor_contract_periods limit 1;`).trim();
 deny(1,periodCall,'SR003');
 sql(as(1,`select public.aunor_mutate_v1('publish','${a}','${randomUUID()}','{"expectedVersion":0,"summary":"Resumen sintético","serviceId":"cobertura","notPerformedReason":""}');`));
 deny(4,`public.assign_contract_period_v1('${a}',4,1,'${p}',true)`);
 deny(1,`public.assign_contract_period_v1('${a}',4,1,'${p}',false)`,'SR003');
 sql(as(1,`select public.assign_contract_period_v1('${a}',4,1,'${p}',true);`));
 sql(as(4,`do $$begin assert(select contract_period_id='${p}' from public.aunor_activities where id='${a}');assert(select target=10 from public.aunor_contract_periods where id='${p}');end $$;`));
 sql(as(1,`select public.aunor_mutate_v1('publish','${a}','${randomUUID()}','{"expectedVersion":1,"summary":"Resumen sintético","serviceId":"redes","notPerformedReason":""}');`));
 sql(as(4,`do $$begin assert(select contract_period_id is null from public.aunor_activities where id='${a}');end $$;`));
 deny(1,`public.assign_contract_period_v1('${a}',6,2,'${p}',true)`,'SR003');
 sql(as(1,`select public.aunor_mutate_v1('publish','${a}','${randomUUID()}','{"expectedVersion":2,"summary":"Resumen sintético","serviceId":"cobertura","notPerformedReason":""}');`));
 sql(as(4,`do $$begin assert(select contract_period_id is null from public.aunor_activities where id='${a}');end $$;`));
 const relationKey=randomUUID();
 const relation={activityVersion:6,publicationVersion:3,summary:'Resumen compacto',serviceId:'cobertura',periodId:p,notPerformedReason:'',confirmed:true};
 const bundle=(command,activity,key,payload)=>`public.save_admin_activity_bundle_v1('${command}','${activity}','${key}','${JSON.stringify(payload)}')`;
 deny(2,bundle('relation',a,relationKey,relation));deny(4,bundle('relation',a,relationKey,relation));
 deny(1,bundle('relation',a,randomUUID(),{...relation,confirmed:false}),'SR003');
 deny(1,bundle('relation',a,randomUUID(),{...relation,activityVersion:1}),'SR001');
 deny(1,bundle('relation',a,randomUUID(),{...relation,serviceId:'redes'}),'SR003');
 sql(`do $$begin assert(select version=3 from private.aunor_publications where activity_id='${a}' and superseded_at is null);assert(select contract_period_id is null and version=6 from public.activities where id='${a}');end $$;`);
 sql(as(1,`select ${bundle('relation',a,relationKey,relation)};select ${bundle('relation',a,relationKey,relation)};`));
 deny(1,bundle('relation',a,relationKey,{...relation,summary:'Different'}),'SR006');
 sql(`do $$begin assert(select version=4 from private.aunor_publications where activity_id='${a}' and superseded_at is null);assert(select contract_period_id='${p}' and version=7 and status='Entregada' from public.activities where id='${a}');end $$;`);
 const replacementKey=randomUUID(),replacement={activityVersion:7,originalId:e,agreementId:'',reason:'Acuerdo de sustitución sintético',channel:'Llamada',contactedAt:'2026-04-12T12:00:00Z',requesterDeclared:'Solicitante sintético',evidenceLink:''};
 const beforeAgreements=sql('select count(*) from private.aunor_agreements;').trim();
 // The agreement insert succeeds, but the replacement constraint fails: both roll back.
 deny(1,bundle('replacement',a,randomUUID(),{...replacement,reason:'x'.repeat(3001)}),'SR003');
 if(sql('select count(*) from private.aunor_agreements;').trim()!==beforeAgreements)throw Error('Partial agreement persisted');
 deny(2,bundle('replacement',a,replacementKey,replacement));deny(4,bundle('replacement',a,replacementKey,replacement));
 sql(as(1,`select ${bundle('replacement',a,replacementKey,replacement)};select ${bundle('replacement',a,replacementKey,replacement)};`));
 sql(`do $$begin assert(select count(*)=1 from private.aunor_replacements where original_activity_id='${e}' and substitute_activity_id='${a}');assert(select count(*)=${Number(beforeAgreements)+1} from private.aunor_agreements);end $$;`);
 deny(1,bundle('replacement',a,randomUUID(),replacement),'SR001');
 console.log('PASS compact relation and replacement: Admin only, stale versions, atomic rollback, idempotent retries, no status changes');
 sql(as(1,`select public.restart_activity_v2('${a}',7,'Reinicio sintético');`));
 sql(`do $$begin assert exists(select 1 from public.activities where id<>'${a}' and classification='special' and status='Programada' and historical_regularized_at is null);end $$;`);
 console.log('PASS editing deadline, immutable journeys, explicit contract periods, overlaps, wrong-service exclusion and restart');
} finally {
 if(created && /^sr_history_test_[a-f0-9]{32}$/.test(database)) {run(['dropdb','-U','postgres','--force',database]);console.log('Removed only the disposable database '+database);}
}
