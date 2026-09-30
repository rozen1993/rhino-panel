// Isolated SQL gate: no Supabase credentials, project link, user DB or host ports.
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const container='sr_sql_ci_'+randomUUID().replaceAll('-','');
let created=false;
function docker(args){
 const r=spawnSync('docker',args,{encoding:'utf8',windowsHide:true});
 if(r.error||r.status!==0)throw Error(r.error?.message||r.stderr||'Docker test failed');
 return r.stdout;
}
try {
 docker(['run','--detach','--name',container,'--label','davinci-purpose=disposable-sql-audit','--env','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17']);
 created=true;
 let ready=false;
 for(let attempt=0;attempt<60;attempt++){
  const r=spawnSync('docker',['exec',container,'pg_isready','-U','postgres'],{encoding:'utf8',windowsHide:true});
  if(r.status===0){ready=true;break;}
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 if(!ready)throw Error('Isolated PostgreSQL did not become ready');
 docker(['exec',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-c','CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;']);
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('./verify-history-contract.mjs',import.meta.url))],{
  stdio:'inherit',windowsHide:true,env:{...process.env,SISTEMA_R_TEST_DB_CONTAINER:container},
 });
 if(result.error||result.status!==0)throw Error('Isolated migration/SQL checks failed');
 console.log('PASS: PostgreSQL 17 CI gate, no existing database touched.');
} finally {
 if(created && /^sr_sql_ci_[a-f0-9]{32}$/.test(container)){
  const label=docker(['inspect','--format','{{index .Config.Labels "davinci-purpose"}}',container]).trim();
  if(label!=='disposable-sql-audit')throw Error('Refusing to remove an unrecognized container');
  docker(['rm','--force','--volumes',container]);
  console.log('Removed only this run’s disposable SQL container and anonymous volume.');
 }
}
