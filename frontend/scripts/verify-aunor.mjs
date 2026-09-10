// Creates and removes ONLY its own new database. Never resets the user's DB.
import { spawnSync, spawn } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const container = "supabase_db_sistema-r";
const database = "sr_aunor_test_" + randomUUID().replaceAll("-", "");
const migrations = fileURLToPath(new URL("../../supabase/migrations/", import.meta.url));
function run(args, input) {
  const r = spawnSync("docker", ["exec", ...(input ? ["-i"] : []), container, ...args], { input, encoding:"utf8", windowsHide:true });
  if (r.error || r.status !== 0) throw Error(r.error?.message || r.stderr || r.stdout);
  return r.stdout;
}
function sql(input) { return run(["psql","-X","-v","ON_ERROR_STOP=1","-U","postgres","-d",database],input); }
const id=n=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const as=(n,body)=>"begin; set local role authenticated; select set_config('request.jwt.claims','"+JSON.stringify({sub:id(100+n),session_id:id(200+n),role:"authenticated"})+"',true); "+body+" commit;";
const mutate=(cmd,a,p,key=randomUUID())=>"public.aunor_mutate_v1('"+cmd+"','"+id(a)+"','"+key+"','"+JSON.stringify(p).replaceAll("'","''")+"'::jsonb)";
function deny(n,expression,code="SR002") {
  sql(as(n,"do $$ begin begin perform "+expression+"; raise exception 'EXPECTED "+code+"'; exception when sqlstate '"+code+"' then null; end; end $$;"));
}
function sqlAsync(input) {
  return new Promise((resolve,reject)=>{
    const p=spawn("docker",["exec","-i",container,"psql","-X","-At","-v","ON_ERROR_STOP=1","-U","postgres","-d",database],{windowsHide:true});
    let out="",errors="";
    p.stdout.on("data",c=>{out+=c;});p.stderr.on("data",c=>{errors+=c;});
    p.once("error",reject);p.once("close",code=>code===0?resolve(out):reject(Error(errors||out)));
    p.stdin.end(input);
  });
}
async function concurrentConfirm(cmd,a,payload) {
  const results=await Promise.allSettled([1,2].map(()=>sqlAsync(as(5,"select "+mutate(cmd,a,payload)+"; select pg_sleep(0.25);"))));
  for(const r of results)if(r.status==="rejected")throw r.reason;
}
const views=["aunor_activities","aunor_journeys","aunor_services","aunor_deliveries","aunor_agreements","aunor_replacements","aunor_messages"];
let created=false;
try {
  run(["createdb","-U","postgres","--template=template0","--owner=postgres",database]);
  created=true;
  console.log("Base NUEVA: "+database);
  sql("create schema extensions; create schema auth; create table auth.users(id uuid primary key); "+
    "create function auth.jwt() returns jsonb language sql stable set search_path='' as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$; "+
    "create function auth.uid() returns uuid language sql stable set search_path='' as $$ select nullif(auth.jwt()->>'sub','')::uuid $$; "+
    "grant usage on schema public,auth,extensions to anon,authenticated,service_role; "+
    "revoke all on function auth.jwt(),auth.uid() from public; grant execute on function auth.jwt(),auth.uid() to anon,authenticated,service_role;");
  const files=readdirSync(migrations).filter(n=>n.endsWith(".sql")).sort();
  if(files.at(-1)!=="202609100001_account_safety.sql") throw Error("Revise schema boundary before running this verifier.");
  for(const name of files.filter(n=>n<"202609080001")) sql(readFileSync(migrations+"/"+name,"utf8"));
  console.log("PASS: cadena anterior de migraciones, exclusivamente en DB nueva.");
  sql("insert into auth.users values "+[1,2,3,4,5,6].map(n=>"('"+id(100+n)+"')").join(",")+";"+
    "insert into public.profiles(id,username,display_name,role,is_burson_operator) values "+
    [ ["admin","Admin","admin",false],["operator","Operator","operario",true],["other","Other","operario",false],["burson","Burson","burson",false],["aunor","Aunor","aunor",false],["former","Former Operator","operario",false] ].map((v,i)=>"('"+id(101+i)+"','test."+v[0]+"','"+v[1]+"','"+v[2]+"',"+v[3]+")").join(",")+";"+
    "insert into public.app_sessions(session_id,user_id) values "+[1,2,3,4,5,6].map(n=>"('"+id(200+n)+"','"+id(100+n)+"')").join(",")+";");
  for(const [n,title,origin,delivered] of [[301,"Entrevistas","operario",true],[302,"Original","operario",false],[303,"Privada","operario",true],[304,"Encargo privado","burson",false],[305,"Sustituto alternativo","operario",true]]) {
    sql("insert into public.activities(id,origin,created_by,created_by_role,responsible_id,responsible_name,type,title,description,place,status,material_link,operator_opinion,delivered_at) values "+
      "('"+id(n)+"','"+origin+"','"+id(origin==="burson"?104:101)+"','"+(origin==="burson"?"burson":"admin")+"','"+id(102)+"','Operator','Grabación','"+title+"','Descripcion privada','Norte','"+(delivered?"Entregada":"Programada")+"','"+(delivered?"https://example.invalid/material-v1.mp4":"")+"','SECRETO OPINION',"+(delivered?"now()":"null")+");"+
      "insert into public.activity_date_spans(activity_id,position,start_date,end_date,place) values ('"+id(n)+"',1,'2026-06-16','2026-06-16','Caseta Norte');");
  }
  sql(as(5,"do $$ begin assert (select count(*)=0 from public.activities); assert (select count(*)=0 from public.activity_date_spans); assert (select count(*)=0 from public.audit_events); assert (select count(*)=0 from public.activity_messages); assert (select count(*)=0 from public.aunor_activities); assert (select count(*)=12 from public.aunor_services); end $$;"));
  for(const n of [2,3,4]) sql(as(n,"do $$ begin assert (select count(*)=0 from public.aunor_services); end $$;"));
  sql("do $$ begin assert not has_table_privilege('authenticated','private.aunor_messages','select'); assert not has_table_privilege('service_role','private.aunor_confirmations','insert'); assert not has_function_privilege('anon','public.aunor_mutate_v1(text,uuid,uuid,jsonb)','execute'); end $$;");
  deny(1,"public.update_account_v1('"+id(103)+"',(select updated_at from public.profiles where id='"+id(103)+"'),'Other','aunor',true,false,false)","SR009");
  sql("insert into auth.users values ('"+id(107)+"'); begin; set local role service_role; do $$ begin begin perform public.create_account_profile_v1('"+id(107)+"','test.extra','Extra Aunor','aunor',false,false,'"+id(101)+"'); raise exception 'EXPECTED SR009'; exception when sqlstate 'SR009' then null; end; end $$; commit;");
  sql("do $$ begin assert not exists(select 1 from public.profiles where id='"+id(107)+"'); assert (select count(*)=1 from public.profiles where role='aunor' and is_active); end $$;");
  const pub={expectedVersion:0,summary:"Resumen publicado",serviceId:"cobertura",notPerformedReason:""};
  for(const n of [2,3,4,5]) deny(n,mutate("publish",301,pub));
  deny(1,mutate("publish",304,pub));
  for(const a of [301,302,305]) sql(as(1,"select "+mutate("publish",a,{...pub,serviceId:a===305?"":"cobertura",notPerformedReason:a===302?"Evento cancelado según llamada":""})+";"));
  sql(as(5,"do $$ begin assert (select count(*)=3 from public.aunor_activities); assert (select count(*)=3 from public.aunor_journeys); assert (select service_id is null from public.aunor_activities where id='"+id(305)+"'); assert (select count(*)=0 from public.activities); assert (select count(*)=0 from public.audit_events); end $$;"));
  deny(5,mutate("message",303,{body:"No debe acceder"}));
  deny(1,mutate("publish",301,pub),"SR001");
  sql(as(1,"select "+mutate("publish",301,{...pub,expectedVersion:1,summary:"Resumen corregido"})+";"));
  sql("do $$ begin assert (select count(*)=2 from private.aunor_publications where activity_id='"+id(301)+"'); end $$;");
  console.log("PASS: publicación explícita, Por relacionar, historial, Burson y roles aislados.");
  const messageKey=randomUUID();
  sql(as(5,"select "+mutate("message",301,{body:"¿Podemos revisar este material?"},messageKey)+"; select "+mutate("message",301,{body:"¿Podemos revisar este material?"},messageKey)+";"));
  deny(5,mutate("message",301,{body:"Otro contenido"},messageKey),"SR006");
  for(const n of [2,4]) deny(n,mutate("message",301,{body:"Intrusión"}));
  sql(as(1,"select "+mutate("message",301,{body:"Sí, el enlace ya está publicado."})+";"));
  sql(as(5,"do $$ begin assert (select count(*)=2 from public.aunor_messages); assert (select count(*)=0 from public.activity_messages); assert (select unread_count=1 from public.aunor_activities where id='"+id(301)+"'); end $$;"));
  const data=sql("select jsonb_build_object('id',id,'sequence',sequence) from private.aunor_messages where author_role='aunor' limit 1;").match(/\{[^\n]+\}/);
  const own=JSON.parse(data[0]);
  sql(as(5,"select "+mutate("message",301,{body:"Corrección: revisaremos mañana.",correctsId:own.id})+";"));
  deny(1,mutate("message",301,{body:"Cambio del cliente",correctsId:own.id}));
  sql(as(5,"select "+mutate("read",301,{sequence:own.sequence})+";"));
  deny(5,mutate("read",301,{sequence:999999}),"SR003");
  sql(as(1,"select "+mutate("delivery",301,{expectedActivityVersion:1,label:"Material publicado"})+";"));
  const delivery=JSON.parse(sql("select jsonb_build_object('id',id,'version',version) from private.aunor_deliveries limit 1;").match(/\{[^\n]+\}/)[0]);
  const confirm={objectId:delivery.id,version:delivery.version,acknowledged:true};
  deny(1,mutate("confirm-delivery",301,confirm));
  deny(5,mutate("confirm-delivery",301,{...confirm,acknowledged:false}),"SR003");
  deny(5,mutate("confirm-delivery",305,confirm));
  await concurrentConfirm("confirm-delivery",301,confirm);
  sql("do $$ begin assert (select count(*)=1 from private.aunor_confirmations); assert (select thread_opened_at is null from public.activities where id='"+id(301)+"'); end $$;");
  sql(as(2,"select public.update_execution_v1('"+id(301)+"',1,'https://example.invalid/material-v2.mp4','SECRETO CAMBIADO');"));
  deny(5,mutate("confirm-delivery",301,confirm),"SR001");
  sql(as(5,"do $$ begin assert (select confirmed_at is not null and not is_current from public.aunor_deliveries where id='"+delivery.id+"'); end $$;"));
  sql(as(1,"select "+mutate("delivery",301,{expectedActivityVersion:2,label:"Nueva entrega"})+";"));
  sql(as(5,"do $$ begin assert (select confirmed_at is null from public.aunor_deliveries where is_current); end $$;"));
  console.log("PASS: mensajes separados, corrección preservada, idempotencia, objeto confirmado y cambio de material.");
  const agreementPayload={channel:"Llamada",contactedAt:"2026-06-11T16:30:00-05:00",requesterDeclared:"Ejecutivo según llamada",body:"Solicitó documentar un sustituto.",evidenceLink:""};
  sql(as(1,"select "+mutate("agreement",302,agreementPayload)+";"));
  const agreementId=sql("select id from private.aunor_agreements limit 1;").match(/[a-f0-9]{8}-[a-f0-9-]{27,}/)[0];
  sql(as(1,"select "+mutate("replacement",302,{substituteId:id(301),agreementId,reason:"Evento cancelado",evidenceNote:"Nota de llamada registrada",evidenceLink:""})+";"));
  const replacementId=sql("select id from private.aunor_replacements limit 1;").match(/[a-f0-9]{8}-[a-f0-9-]{27,}/)[0];
  await concurrentConfirm("confirm-replacement",302,{objectId:replacementId,acknowledged:true});
  sql(as(5,"do $$ begin assert (select confirmed_by='Aunor' from public.aunor_replacements); assert (select count(*)=1 from public.aunor_agreements); end $$;"));
  deny(1,mutate("replacement",302,{substituteId:id(303),agreementId,reason:"Intento",evidenceNote:"Nota",evidenceLink:""}));
  for(const view of views) {
    sql("begin; set local role anon; do $$ begin begin perform 1 from public."+view+"; raise exception 'EXPECTED 42501'; exception when insufficient_privilege then null; end; end $$; commit;");
    for(const n of [2,3,4]) sql(as(n,"do $$ begin assert (select count(*)=0 from public."+view+"); end $$;"));
  }
  deny(5,mutate("message",301,{body:"   "}),"SR003");
  deny(1,mutate("agreement",302,{...agreementPayload,contactedAt:"not-a-date"}),"SR003");
  deny(1,mutate("agreement",302,{...agreementPayload,correctsId:"not-a-uuid"}),"SR003");
  sql(as(1,"select "+mutate("agreement",302,{...agreementPayload,body:"Corrección de la llamada",correctsId:agreementId})+";"));
  deny(1,mutate("agreement",302,{...agreementPayload,correctsId:agreementId}),"SR002");
  sql(as(5,"do $$ begin assert (select not is_current from public.aunor_agreements where id='"+agreementId+"'); end $$;"));
  const rep={substituteId:id(305),agreementId,reason:"Corrección documentada",evidenceNote:"Nota corregida sin borrar original",evidenceLink:"",correctsId:replacementId};
  sql(as(1,"select "+mutate("replacement",302,rep)+";"));
  deny(5,mutate("confirm-replacement",302,{objectId:replacementId,acknowledged:true}),"SR001");
  deny(1,mutate("replacement",302,rep),"SR002");
  sql(as(5,"do $$ begin assert (select confirmed_at is not null and not is_current from public.aunor_replacements where id='"+replacementId+"'); assert (select confirmed_at is null from public.aunor_replacements where is_current); end $$;"));
  // A -> B -> A cannot revive a confirmation object.
  sql(as(1,"select "+mutate("delivery",305,{expectedActivityVersion:1,label:"Entrega ABA"})+";"));
  const aba=JSON.parse(sql("select jsonb_build_object('id',id,'version',version) from private.aunor_deliveries where activity_id='"+id(305)+"';").match(/\{[^\n]+\}/)[0]);
  sql(as(2,"select public.update_execution_v1('"+id(305)+"',1,'https://example.invalid/changed.mp4',''); select public.update_execution_v1('"+id(305)+"',2,'https://example.invalid/material-v1.mp4','');"));
  deny(5,mutate("confirm-delivery",305,{objectId:aba.id,version:aba.version,acknowledged:true}),"SR001");
  // A later execution hides the old non-performance label, not its source record.
  sql(as(2,"select public.advance_activity_v1('"+id(302)+"',1); select public.update_execution_v1('"+id(302)+"',2,'https://example.invalid/delivered.mp4',''); select public.advance_activity_v1('"+id(302)+"',3);"));
  sql(as(5,"do $$ begin assert (select not_performed_reason='' from public.aunor_activities where id='"+id(302)+"'); end $$;"));
  sql("do $$ begin assert (select not_performed_reason<>'' from private.aunor_publications where activity_id='"+id(302)+"' and superseded_at is null); end $$;");
  sql("update public.activities set responsible_id='"+id(106)+"',responsible_name='Former' where id='"+id(303)+"';");
  sql(as(1,"select public.post_activity_message_v1('"+id(303)+"',1,'PRIVADO ADMIN');"));
  sql(as(6,"select public.post_activity_message_v1('"+id(303)+"',null,'PRIVADO OPERARIO');"));
  sql(as(5,"do $$ begin assert (select count(*)=0 from public.activity_messages); assert (select count(*)=0 from public.audit_events); end $$;"));
  sql("update public.profiles set is_active=false where id='"+id(105)+"'; update public.profiles set role='aunor' where id='"+id(106)+"';");
  const internal=sql("select id from public.activity_messages where author_id='"+id(106)+"';").match(/[a-f0-9]{8}-[a-f0-9-]{27,}/)[0];
  deny(6,"public.edit_activity_message_v1('"+internal+"',1,'Intento')");
  deny(6,"public.delete_activity_message_v1('"+internal+"',1)");
  deny(6,"public.post_activity_message_v1('"+id(303)+"',null,'Intento')");
  sql(as(6,"do $$ begin assert (select count(*)=0 from public.activity_messages); assert (select count(*)=0 from public.audit_events); end $$;"));
  sql("do $$ begin assert (select count(*)=2 from public.activity_messages where activity_id='"+id(303)+"' and deleted_at is null); end $$;");
  sql("update public.profiles set role='operario' where id='"+id(106)+"'; update public.profiles set is_active=true where id='"+id(105)+"';");
  sql(as(1,"select public.soft_delete_activity_v1('"+id(301)+"',2,'Baja ficticia aislada');"));
  sql(as(5,"do $$ begin assert (select count(*)=0 from public.aunor_messages); assert (select count(*)=0 from public.aunor_deliveries where activity_id=\'"+id(301)+"\'); assert (select count(*)=0 from public.aunor_replacements where substitute_activity_id=\'"+id(301)+"\'); end $$;"));
  deny(5,mutate("confirm-delivery",301,confirm));
  sql("update public.app_sessions set revoked_at=now() where user_id='"+id(105)+"';");
  sql(as(5,"do $$ begin assert (select count(*)=0 from public.aunor_activities); assert (select count(*)=0 from public.aunor_services); end $$;"));
  for(const view of views) sql(as(5,"do $$ begin assert (select count(*)=0 from public."+view+"); end $$;"));
  console.log("PASS: concurrencia real, anon, unicidad Aunor, ABA, correcciones lineales y datos internos existentes.");
  console.log("PASS: acuerdos, reemplazos, exoperario reclasificado, baja interna y sesión revocada.");

  // Test the forward retirement against populated historical records in THIS disposable DB.
  const archivedCount=Number(sql("select count(*) from private.aunor_messages;").match(/\n\s*(\d+)\s*\n/)[1]);
  sql(readFileSync(migrations+"/202609080001_retire_burson_external_chat.sql","utf8"));
  sql("do $$ begin assert (select count(*)=6 from public.profiles); assert (select not is_active from public.profiles where role='burson'); assert not exists(select 1 from public.profiles where is_burson_operator); assert (select is_active and role='operario' from public.profiles where id='"+id(102)+"'); assert (select count(*)="+archivedCount+" from private.aunor_messages); assert (select count(*)=5 from public.activities); assert (select origin='burson' and responsible_id='"+id(102)+"' from public.activities where id='"+id(304)+"'); assert (select revoked_at is not null from public.app_sessions where user_id='"+id(102)+"'); end $$;");
  for(const apiRole of ["anon","authenticated","service_role"]) {
    sql("do $$ begin assert not has_table_privilege('"+apiRole+"','public.aunor_messages','select'); assert not has_function_privilege('"+apiRole+"','public.create_burson_request_v2(uuid,public.activity_type,text,text,text,jsonb,text)','execute'); end $$;");
  }
  // Fresh test sessions only; old Burson session must remain unusable.
  sql("update public.app_sessions set revoked_at=null where user_id in ('"+id(102)+"','"+id(105)+"');");
  sql(as(4,"do $$ begin assert (select count(*)=0 from public.activities); assert (select count(*)=0 from public.aunor_activities); end $$;"));
  for(const actor of [1,5]) {
    deny(actor,mutate("message",301,{body:"¿Podemos revisar este material?"},messageKey));
    deny(actor,mutate("read",301,{sequence:own.sequence}));
  }
  deny(1,"public.update_account_v1('"+id(102)+"',(select updated_at from public.profiles where id='"+id(102)+"'),'Operator','operario',true,true,false)","SR009");
  deny(1,"public.update_account_v1('"+id(104)+"',(select updated_at from public.profiles where id='"+id(104)+"'),'Burson','burson',true,false,false)","SR009");
  sql("begin; set local role service_role; do $$ begin begin perform public.create_account_profile_v1('"+id(107)+"','test.retired','Retired','burson',false,false,'"+id(101)+"'); raise exception 'EXPECTED SR009'; exception when sqlstate 'SR009' then null; end; end $$; commit;");
  sql(as(1,"select public.replan_activity_v2('"+id(304)+"',1,'"+id(103)+"','Grabación','Encargo histórico','Se conserva el origen','Lima','[{\"start\":\"2026-06-16\",\"end\":\"2026-06-16\",\"place\":\"Lima\"}]'::jsonb);"));
  sql(as(3,"do $$ begin assert exists(select 1 from public.activities where id='"+id(304)+"'); end $$;"));
  sql(as(1,"select public.soft_delete_activity_v1('"+id(304)+"',2,'Archivo temporal de prueba'); select public.restore_activity_v1('"+id(304)+"',3,'"+id(102)+"');"));
  sql("do $$ begin assert (select origin='burson' and created_by='"+id(104)+"' and responsible_id='"+id(102)+"' and deleted_at is null from public.activities where id='"+id(304)+"'); end $$;");
  // Confirmations stay available without a chat. Duplicate requests don't create another confirmation.
  sql(as(1,"select public.restore_activity_v1('"+id(301)+"',3,null); select "+mutate("delivery",301,{expectedActivityVersion:4,label:"Entrega sin chat"})+";"));
  const currentDelivery=JSON.parse(sql("select jsonb_build_object('id',id,'version',version) from private.aunor_deliveries where activity_id='"+id(301)+"' order by version desc limit 1;").match(/\{[^\n]+\}/)[0]);
  await concurrentConfirm("confirm-delivery",301,{objectId:currentDelivery.id,version:currentDelivery.version,acknowledged:true});
  const currentReplacement=sql("select r.id from private.aunor_replacements r where not exists(select 1 from private.aunor_replacements c where c.corrects_id=r.id) limit 1;").match(/[a-f0-9]{8}-[a-f0-9-]{27,}/)[0];
  await concurrentConfirm("confirm-replacement",302,{objectId:currentReplacement,acknowledged:true});
  sql(as(5,"do $$ begin assert (select confirmed_by='Aunor' from public.aunor_deliveries where id='"+currentDelivery.id+"'); assert (select confirmed_by='Aunor' from public.aunor_replacements where id='"+currentReplacement+"'); assert not exists(select 1 from public.aunor_activities where unread_count<>0); assert (select count(*)=0 from public.activity_messages); assert (select count(*)=0 from public.audit_events); end $$;"));
  sql("do $$ begin assert (select count(*)="+archivedCount+" from private.aunor_messages); assert (select count(*)=2 from public.activity_messages where activity_id='"+id(303)+"'); end $$;");
  console.log("PASS: retirada Burson, sesiones antiguas, operarios normales, chat archivado y bloqueado incluso ante replay, confirmaciones concurrentes e historial conservados.");

  // Forward migration gates run after the historical-retirement checks.
  sql("create table auth.sessions(id uuid primary key,user_id uuid,created_at timestamptz not null);");
  for(const name of files.filter(n=>n>"202609080001_retire_burson_external_chat.sql")) sql(readFileSync(migrations+"/"+name,"utf8"));
  sql("do $$ begin assert has_column_privilege('service_role','public.profiles','id','select'); assert has_column_privilege('service_role','public.profiles','username','select'); assert not has_column_privilege('service_role','public.profiles','display_name','select'); assert not has_table_privilege('anon','public.profiles','select'); end $$;");
  sql("begin; set local role anon; do $$ begin assert (select count(*)>0 from public.access_directory_v1()); end $$; commit;");
  sql("select public.begin_credential_operation_v1('"+id(102)+"','"+id(101)+"','"+id(901)+"');");
  sql("do $$ begin begin perform public.begin_credential_operation_v1('"+id(102)+"','"+id(101)+"','"+id(902)+"'); raise exception 'mutex failed'; exception when sqlstate 'SR001' then null; end; end $$;");
  sql("select public.end_credential_operation_v1('"+id(102)+"','"+id(901)+"');");
  sql("do $$ begin begin perform public.begin_credential_operation_v1('"+id(101)+"','"+id(101)+"','"+id(903)+"'); raise exception 'self reset allowed'; exception when sqlstate 'SR002' then null; end; end $$;");
  sql("insert into auth.sessions values('"+id(950)+"','"+id(102)+"',now()-interval '1 day'); update public.profiles set must_change_password=true where id='"+id(102)+"';");
  sql("begin; set local role authenticated; select set_config('request.jwt.claims','"+JSON.stringify({sub:id(102),session_id:id(950),role:"authenticated"})+"',true); do $$ begin begin perform public.register_app_session(); raise exception 'old unregistered token accepted'; exception when sqlstate 'SR002' then null; end; end $$; commit;");
  sql("insert into auth.sessions values('"+id(951)+"','"+id(102)+"',clock_timestamp());");
  sql("begin; set local role authenticated; select set_config('request.jwt.claims','"+JSON.stringify({sub:id(102),session_id:id(951),role:"authenticated"})+"',true); select public.register_app_session(); commit;");
  console.log("PASS: current schema, minimal grants, public directory, credential mutex, self-reset and old/new Auth sessions.");
} finally {
  if(created && /^sr_aunor_test_[a-f0-9]{32}$/.test(database)) {
    run(["dropdb","-U","postgres",database]);
    console.log("Eliminada SOLO la base efímera "+database+". Bases del usuario intactas.");
  }
}
