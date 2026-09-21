// All fixtures and migrations run in a newly generated disposable database.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const container='supabase_db_sistema-r';
const database='sr_operator_test_'+randomUUID().replaceAll('-','');
const migrations=fileURLToPath(new URL('../../supabase/migrations/',import.meta.url));
const target='202609210001_operator_planning_recording_history.sql';
function run(args,input){const r=spawnSync('docker',['exec',...(input?['-i']:[]),container,...args],{input,encoding:'utf8',windowsHide:true});if(r.error||r.status!==0)throw Error(r.error?.message||r.stderr||r.stdout);return r.stdout;}
const sql=input=>run(['psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d',database],input);
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const as=(n,body)=>`begin;set local role authenticated;select set_config('request.jwt.claims','${JSON.stringify({sub:id(100+n),session_id:id(200+n),role:'authenticated'})}',true);${body}commit;`;
const spans=`'[{"start":"2026-09-21","end":"2026-09-21","place":"Norte"}]'::jsonb`;
const args=`'Grabación','Trabajo sintético','Descripción sintética','Lima',${spans}`;
const deny=(n,expression,code='SR002')=>sql(as(n,`do $$ begin begin perform ${expression};raise exception 'Expected ${code}';exception when sqlstate '${code}' then null;end;end $$;`));
const ownEdit=(activity,version=1,modes="array['Video']")=>`public.replan_own_activity_v3('${activity}',${version},${args},${modes})`;
function concurrentSql(input){return new Promise((resolve,reject)=>{
 const p=spawn('docker',['exec','-i',container,'psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d',database],{windowsHide:true});
 let errors='';p.stderr.on('data',c=>{errors+=c;});p.stdout.resume();p.on('error',reject);p.on('close',code=>code===0?resolve():reject(Error(errors)));p.stdin.end(input);
});}
let created=false;
try{
 run(['createdb','-U','postgres','--template=template0','--owner=postgres',database]);created=true;
 console.log('Disposable database: '+database);
 sql(`create schema extensions;create schema auth;create table auth.users(id uuid primary key);
 create function auth.jwt() returns jsonb language sql stable set search_path='' as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
 create function auth.uid() returns uuid language sql stable set search_path='' as $$select nullif(auth.jwt()->>'sub','')::uuid$$;
 grant usage on schema public,auth,extensions to anon,authenticated,service_role;
 revoke all on function auth.jwt(),auth.uid() from public;grant execute on function auth.jwt(),auth.uid() to anon,authenticated,service_role;`);
 const files=readdirSync(migrations).filter(f=>f.endsWith('.sql')).sort();
 if(files.at(-1)!==target)throw Error('Review migration boundary');
 for(const f of files.filter(f=>f!==target))sql(readFileSync(migrations+'/'+f,'utf8'));
 sql(`insert into auth.users values ${[1,2,3,4].map(n=>`('${id(100+n)}')`).join(',')};
 insert into public.profiles(id,username,display_name,role,can_create_own_activities) values
 ('${id(101)}','test.admin','Admin','admin',false),('${id(102)}','test.creator','Creator','operario',true),
 ('${id(103)}','test.other','Other','operario',true),('${id(104)}','test.aunor','Aunor','aunor',false);
 insert into public.app_sessions(session_id,user_id) values ${[1,2,3,4].map(n=>`('${id(200+n)}','${id(100+n)}')`).join(',')};`);
 sql(as(1,`select * from public.plan_activity_v2('${id(301)}','${id(102)}',${args});`));
 sql(as(2,`select * from public.create_own_activity_v2('${id(302)}',${args});`));
 const adminId=sql(`select id from public.activities where idempotency_key='${id(301)}';`).trim();
 const ownId=sql(`select id from public.activities where idempotency_key='${id(302)}';`).trim();
 sql(readFileSync(migrations+'/'+target,'utf8'));
 sql(`do $$begin assert(select count(*)=2 and bool_and(recording_modes='{}') from public.activities);end $$;`);
 deny(2,ownEdit(adminId));deny(3,ownEdit(ownId));deny(4,ownEdit(ownId));
 for(const modes of ["'{}'::text[]","array['Video','Video']","array['otro']","array[null]::text[]"])
   deny(2,ownEdit(ownId,1,modes),'SR003');
 sql(as(2,`select public.update_execution_v1('${ownId}',1,'https://example.invalid/material','Opinión conservada');`));
 deny(2,ownEdit(ownId,1),'SR001');
 sql(as(2,`select ${ownEdit(ownId,2,"array['Vuelo con dron','Fotografía']")};`));
 sql(`do $$begin assert(select version=3 and recording_modes=array['Fotografía','Vuelo con dron'] and material_link='https://example.invalid/material' and operator_opinion='Opinión conservada' from public.activities where id='${ownId}');
 assert exists(select 1 from public.audit_events where activity_id='${ownId}' and action='Planificación propia actualizada' and detail?'antes' and detail?'despues');end $$;`);
 sql(`update public.profiles set can_create_own_activities=false where id='${id(102)}';`);deny(2,ownEdit(ownId,3));
 sql(`update public.profiles set can_create_own_activities=true where id='${id(102)}';update public.activities set responsible_id='${id(103)}' where id='${ownId}';`);deny(2,ownEdit(ownId,3));
 sql(`update public.activities set responsible_id='${id(102)}' where id='${ownId}';`);
 sql(as(2,`select public.advance_activity_v1('${ownId}',3);`));deny(2,ownEdit(ownId,4));
 sql(as(2,`select public.advance_activity_v1('${ownId}',4);`));deny(2,ownEdit(ownId,5));
 console.log('PASS own planning: author, assignee, permission, scheduled status, versions, material preservation and audit');
 sql(as(3,`do $$begin assert(select count(*)=2 from public.team_historical_activities);assert(select count(*)=0 from public.activities);assert(select count(*)=0 from public.audit_events);assert(select count(*)=0 from public.activity_messages);end $$;`));
 sql(as(4,`do $$begin assert(select count(*)=0 from public.team_historical_activities);assert(select count(*)=2 from public.aunor_activities);assert(select recording_modes=array['Fotografía','Vuelo con dron'] from public.aunor_activities where id='${ownId}');end $$;`));
 sql(`do $$begin assert not exists(select 1 from information_schema.columns where table_name='aunor_activities' and column_name in ('responsible_id','responsible_name','created_by'));end $$;`);
 sql(as(1,`select * from public.restart_activity_v2('${ownId}',5,'Reinicio sintético');`));
 sql(`do $$begin assert(select recording_modes=array['Fotografía','Vuelo con dron'] from public.activities where id<>'${ownId}' and created_by='${id(101)}' and recording_modes<>'{}');end $$;`);
 sql(as(3,`do $$begin assert(select count(*)=2 from public.team_historical_activities);assert not exists(select 1 from public.team_historical_activities where id='${ownId}');end $$;`));
 console.log('PASS team history, private data boundaries, Aunor projection, deleted exclusion and restart');
 for(const modes of ["array['Video']","array['Fotografía','Video']","array['Fotografía','Video','Vuelo con dron']"]){
  const key=randomUUID();
  sql(as(2,`select * from public.create_own_activity_v3('${key}',${args},${modes});do $$declare r record;begin select * into r from public.create_own_activity_v3('${key}',${args},${modes});assert r.replayed;end $$;`));
  deny(2,`public.create_own_activity_v3('${key}',${args},array['Vuelo con dron'])`,'SR006');
 }
 deny(2,`public.create_own_activity_v2('${randomUUID()}',${args})`,'42501');
 sql(as(1,`select * from public.replan_activity_v3('${adminId}',1,'${id(102)}',${args},array['Video']);select * from public.replan_activity_v3('${adminId}',2,'${id(102)}','Edición','Edición sintética','Descripción sintética','Lima',${spans},'{}');`));
 sql(`do $$begin assert(select type='Edición' and recording_modes='{}' from public.activities where id='${adminId}');end $$;`);
 console.log('PASS 1/2/3 modalities, idempotency, old RPC denial and type changes');
 const raceKey=randomUUID();
 sql(as(2,`select * from public.create_own_activity_v3('${raceKey}',${args},array['Video']);`));
 const raceId=sql(`select id from public.activities where idempotency_key='${raceKey}';`).trim();
 for(const change of [
  `update public.profiles set can_create_own_activities=false where id='${id(102)}'`,
  `update public.activities set responsible_id='${id(103)}' where id='${raceId}'`,
 ]){
  sql(`update public.profiles set can_create_own_activities=true where id='${id(102)}';`);
  const committed=concurrentSql(`begin;${change};select pg_sleep(1);commit;`);
  let locked=false;
  for(let attempt=0;attempt<80;attempt++){
   if(Number(sql(`select count(*) from pg_stat_activity where datname=current_database() and wait_event='PgSleep';`).trim())>0){locked=true;break;}
   await new Promise(resolve=>setTimeout(resolve,20));
  }
  if(!locked){await committed;throw Error('Did not observe concurrent lock');}
  deny(2,ownEdit(raceId));await committed;
 }
 sql(`do $$begin assert(select version=1 from public.activities where id='${raceId}');assert not has_table_privilege('authenticated','public.team_historical_activities','update');end $$;`);
 sql(`update public.profiles set is_active=false,can_create_own_activities=false where id='${id(103)}';`);
 sql(as(3,`do $$begin assert(select count(*)=0 from public.team_historical_activities);end $$;`));
 console.log('PASS concurrent revocation/reassignment, read-only grants and deactivated account');
 const adminKey=randomUUID();
 sql(as(1,`do $$declare a record;b record;begin
   select * into a from public.plan_activity_v3('${adminKey}','${id(102)}',${args},array['Video','Vuelo con dron']);
   assert not a.replayed;
   select * into b from public.plan_activity_v3('${adminKey}','${id(102)}',${args},array['Vuelo con dron','Video']);
   assert b.replayed and b.activity_id=a.activity_id;
   assert(select recording_modes=array['Video','Vuelo con dron'] from public.activities where id=a.activity_id);
 end $$;`));
 deny(1,`public.plan_activity_v1('${randomUUID()}','${id(102)}',${args})`,'42501');
 console.log('PASS Admin creation with canonical modes and idempotent replay');
}finally{if(created){run(['dropdb','-U','postgres',database]);console.log('Removed only disposable database '+database);}}
