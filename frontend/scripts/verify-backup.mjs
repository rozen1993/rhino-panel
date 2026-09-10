import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve,join } from "node:path";
import { randomUUID } from "node:crypto";
const backup=process.argv[2];
if(!backup)throw Error("Specify the private backup directory");
const directory=resolve(backup);
const database="sr_restore_test_"+randomUUID().replaceAll("-","");
const container="supabase_db_sistema-r";
function run(args,input){
 const r=spawnSync("docker",["exec",...(input?["-i"]:[]),container,...args],{input,encoding:"utf8",windowsHide:true,maxBuffer:16*1024*1024});
 if(r.error||r.status!==0) {
  // Do not echo statements/rows from a private dump into terminal logs.
  const error=(r.stderr??"").split("\n").find(line=>line.includes("ERROR:"))??r.error?.message??"database command failed";
  throw Error(error.replace(/DETAIL:.*/,""));
 }
 return r.stdout;
}
function sql(input){return run(["psql","-X","-qAt","-v","ON_ERROR_STOP=1","-U","supabase_admin","-d",database],input);}
let created=false;
try {
 run(["createdb","-U","supabase_admin","--template=template0",database]);created=true;
 sql('create schema extensions; create extension if not exists citext with schema extensions; create extension if not exists pgcrypto with schema extensions; create extension if not exists "uuid-ossp" with schema extensions;');
 sql(readFileSync(join(directory,"schema.sql"),"utf8"));
 sql("begin; set local session_replication_role=replica;\n"+readFileSync(join(directory,"data.sql"),"utf8")+"\ncommit;");
 console.log(sql("select json_build_object('profiles',(select count(*) from public.profiles),'auth_users',(select count(*) from auth.users),'activities',(select count(*) from public.activities),'migrations',(select count(*) from supabase_migrations.schema_migrations));"));
 console.log("PASS: schema and data restored into isolated database "+database);
} finally {
 if(created&&/^sr_restore_test_[a-f0-9]{32}$/.test(database)){
  run(["dropdb","-U","supabase_admin",database]);
  console.log("Removed only the disposable restored database; source backup preserved.");
 }
}
