// SQL/RLS integration only. Never resets or connects to the user's postgres DB.
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const container = "supabase_db_sistema-r";
const database = `sr_span_place_test_${randomUUID().replaceAll("-", "")}`;
const migrations = fileURLToPath(new URL("../../supabase/migrations/", import.meta.url));
function run(args, input) {
  const result = spawnSync("docker", ["exec", ...(input ? ["-i"] : []), container, ...args], { input, encoding: "utf8", windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || result.stdout);
  return result.stdout;
}
function sql(input) { return run(["psql", "-X", "--set=ON_ERROR_STOP=1", "-U", "postgres", "-d", database], input); }
function concurrentSql(input) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["exec", "-i", container, "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database], { windowsHide: true });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { output += chunk; });
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve(output) : reject(new Error(output)));
    child.stdin.end(input, "utf8");
  });
}
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const claims = (n) => JSON.stringify({ sub: id(100 + n), session_id: id(200 + n), role: "authenticated" });
const asRole = (n, body) => `begin; set local role authenticated; select set_config('request.jwt.claims', '${claims(n)}', true); ${body} commit;`;
const baseArgs = `'${id(102)}', 'Grabación', 'Fixture jornadas', 'Descripción ficticia de prueba', 'Lima'`;
const legacy = `'[{"start":"2026-09-10","end":"2026-09-10"}]'::jsonb`;
const journeys = `'[{"start":"2026-09-10","end":"2026-09-10","place":" Norte "},{"start":"2026-09-10","end":"2026-09-10","place":"Sur"}]'::jsonb`;
let created = false;
try {
  run(["createdb", "-U", "postgres", "--template=template0", "--owner=postgres", database]);
  created = true;
  console.log(`Base efímera creada: ${database}`);
  sql(`create schema extensions; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.jwt() returns jsonb language sql stable set search_path='' as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
    create function auth.uid() returns uuid language sql stable set search_path='' as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
    grant usage on schema public,auth,extensions to anon,authenticated,service_role;
    revoke all on function auth.jwt(),auth.uid() from public;
    grant execute on function auth.jwt(),auth.uid() to anon,authenticated,service_role;`);
  const files = readdirSync(migrations).filter((name) => name.endsWith(".sql")).sort();
  const target = "202609050001_activity_journey_places.sql";
  if (files.at(-1) !== target) throw new Error("Revisar el verificador: cambió el último esquema esperado.");
  for (const name of files.filter((name) => name !== target)) sql(readFileSync(`${migrations}/${name}`, "utf8"));
  sql(`insert into auth.users values ${[1,2,3,4].map((n) => `('${id(100+n)}')`).join(",")};
    insert into public.profiles(id,username,display_name,role,can_create_own_activities,is_burson_operator) values
    ('${id(101)}','test.admin','Test Admin','admin',false,false),
    ('${id(102)}','test.operator','Test Operator','operario',true,true),
    ('${id(103)}','test.other','Test Other','operario',false,false),
    ('${id(104)}','test.burson','Test Burson','burson',false,false);
    insert into public.app_sessions(session_id,user_id) values ${[1,2,3,4].map((n)=>`('${id(200+n)}','${id(100+n)}')`).join(",")};`);
  sql(asRole(1, `select * from public.plan_activity_v1('${id(301)}',${baseArgs},${legacy});`));
  sql(readFileSync(`${migrations}/${target}`, "utf8"));
  sql(`do $$ begin
    assert (select count(*)=1 and bool_and(place='') from public.activity_date_spans), 'legacy inherits, no invented backfill';
    assert not has_function_privilege('anon','public.plan_activity_v2(uuid,uuid,public.activity_type,text,text,text,jsonb)','execute');
    assert not has_function_privilege('authenticated','private.replace_activity_spans(uuid,jsonb)','execute');
    assert not has_table_privilege('authenticated','public.activity_date_spans','update');
  end $$;`);
  sql(asRole(1, `do $$ declare a record; b record; v integer; before_audit bigint; begin
    select * into a from public.plan_activity_v1('${id(301)}',${baseArgs},${legacy});
    assert a.replayed, 'legacy replay survives migration';
    perform public.replan_activity_v1(a.activity_id,a.activity_version,${baseArgs},${legacy});
    assert (select version=2 from public.activities where id=a.activity_id), 'legacy without specific places remains editable';
    begin
      perform public.plan_activity_v2('${id(301)}',${baseArgs},${legacy});
      raise exception 'Expected cross-version SR006'; exception when sqlstate 'SR006' then null;
    end;
    select * into a from public.plan_activity_v2('${id(302)}',${baseArgs},${journeys});
    assert not a.replayed and a.activity_version=1;
    assert (select array_agg(place order by position)=array['Norte','Sur'] from public.activity_date_spans where activity_id=a.activity_id);
    select * into b from public.plan_activity_v2('${id(302)}',${baseArgs},${journeys});
    assert b.replayed and b.activity_id=a.activity_id;
    begin
      perform public.plan_activity_v2('${id(302)}',${baseArgs},replace(${journeys}::text,'Sur','Otro')::jsonb);
      raise exception 'Expected SR006'; exception when sqlstate 'SR006' then null;
    end;
    select count(*) into before_audit from public.audit_events where activity_id=a.activity_id;
    begin
      perform public.replan_activity_v1(a.activity_id,1,${baseArgs},${legacy});
      raise exception 'Expected SR011'; exception when sqlstate 'SR011' then null;
    end;
    assert (select version=1 from public.activities where id=a.activity_id);
    assert (select count(*)=before_audit from public.audit_events where activity_id=a.activity_id);
    begin
      perform public.replan_activity_v1(a.activity_id,1,${baseArgs},'[{"start":"2026-09-10","end":"2026-09-10","place":"Norte"},{"start":"2026-09-10","end":"2026-09-10"}]');
      raise exception 'Expected partial-payload SR011'; exception when sqlstate 'SR011' then null;
    end;
    assert (select array_agg(place order by position)=array['Norte','Sur'] from public.activity_date_spans where activity_id=a.activity_id);
    perform public.replan_activity_v2(a.activity_id,1,${baseArgs},replace(${journeys}::text,'Sur','Este')::jsonb);
    assert (select version=2 and material_link='' and status='Programada' from public.activities where id=a.activity_id);
    begin
      perform public.replan_activity_v2(a.activity_id,1,${baseArgs},${journeys});
      raise exception 'Expected SR001'; exception when sqlstate 'SR001' then null;
    end;
    select * into a from public.plan_activity_v2('${id(303)}',${baseArgs},${legacy});
    select * into b from public.plan_activity_v2('${id(303)}',${baseArgs},'[{"start":"2026-09-10","end":"2026-09-10","place":""}]');
    assert b.replayed and b.activity_id=a.activity_id, 'canonical empty replay';
  end $$;`));
  console.log("PASS: legado, lugares múltiples, idempotencia, guard de cliente antiguo, versión y atomicidad.");
  for (const spans of [
    [{start:"2026-09-10",end:"2026-09-10",place:42}],
    [{start:"2026-09-10",end:"2026-09-10",place:null}],
    [{start:"2026-09-10",end:"2026-09-10",place:"x".repeat(301)}],
    [{start:null,end:"2026-09-10"}],
    [{start:"2026-02-30",end:"2026-03-01"}],
    [{start:"2026-09-11",end:"2026-09-10"}],
    [{start:"2026-09-10T12:00",end:"2026-09-10"}],
    Array.from({length:101},()=>({start:"2026-09-10",end:"2026-09-10"})),
  ]) {
    sql(asRole(1, `do $$ begin begin
      perform public.plan_activity_v2('${randomUUID()}',${baseArgs},'${JSON.stringify(spans)}');
      raise exception 'Expected SR003'; exception when sqlstate 'SR003' then null;
    end; end $$;`));
  }
  for (const n of [2,3,4]) sql(asRole(n, `do $$ begin begin
    perform public.replan_activity_v2((select id from public.activities limit 1),1,${baseArgs},${journeys});
    raise exception 'Expected SR002'; exception when sqlstate 'SR002' then null;
  end; end $$;`));
  sql(asRole(3, `do $$ begin
    assert (select count(*)=0 from public.activity_date_spans), 'unassigned operator RLS';
    begin perform public.create_own_activity_v2('${id(304)}','Grabación','Propia test','Descripción test','',${journeys});
      raise exception 'Expected SR002'; exception when sqlstate 'SR002' then null; end;
  end $$;`));
  sql(asRole(2, `do $$ declare a record; begin
    select * into a from public.create_own_activity_v2('${id(305)}','Grabación','Propia test','Descripción test','',${journeys});
    assert (select responsible_id=auth.uid() from public.activities where id=a.activity_id);
    assert (select count(*)=2 from public.activity_date_spans where activity_id=a.activity_id);
  end $$;`));
  sql(asRole(4, `do $$ declare a record; begin
    assert (select count(*)=0 from public.activity_date_spans), 'Burson does not see ordinary work';
    select * into a from public.create_burson_request_v2('${id(306)}','Grabación','Encargo test','Descripción test','',${journeys},'');
    assert (select array_agg(place order by position)=array['Norte','Sur'] from public.activity_date_spans where activity_id=a.activity_id);
  end $$;`));
  console.log("PASS: validación de jornadas, creación autorizada, Burson, roles y RLS.");
  sql(asRole(2, `do $$ declare a record; begin
    select * into a from public.activities where idempotency_key='${id(305)}';
    perform public.update_execution_v1(a.id,a.version,'https://example.invalid/test','Evidencia ficticia');
    assert (select array_agg(place order by position)=array['Norte','Sur'] from public.activity_date_spans where activity_id=a.id);
  end $$;`));
  sql(asRole(1, `do $$ declare a record; begin
    select * into a from public.activities where idempotency_key='${id(305)}';
    perform public.soft_delete_activity_v1(a.id,a.version,'Baja ficticia para verificar preservación');
    assert (select array_agg(place order by position)=array['Norte','Sur'] from public.activity_date_spans where activity_id=a.id);
    perform public.restore_activity_v1(a.id,a.version+1,null);
    assert (select array_agg(place order by position)=array['Norte','Sur'] from public.activity_date_spans where activity_id=a.id);
    assert (select material_link='https://example.invalid/test' from public.activities where id=a.id);
  end $$;`));
  const concurrentUpdate = asRole(1, `set local statement_timeout='10s'; do $$ declare target uuid; begin
    select id into target from public.activities where idempotency_key='${id(302)}';
    begin
      perform public.replan_activity_v2(target,2,${baseArgs},${journeys});
      raise notice 'REPLAN_OK';
    exception when sqlstate 'SR001' then raise notice 'REPLAN_CONFLICT'; end;
  end $$;`);
  const results = await Promise.all([concurrentSql(concurrentUpdate),concurrentSql(concurrentUpdate)]);
  if (results.filter(r=>r.includes("REPLAN_OK")).length !== 1 || results.filter(r=>r.includes("REPLAN_CONFLICT")).length !== 1) throw new Error("Concurrent replans did not serialize");
  sql(`update public.app_sessions set revoked_at=now() where session_id='${id(201)}';`);
  sql(asRole(1, `do $$ begin begin
    perform public.plan_activity_v2('${id(310)}',${baseArgs},${journeys});
    raise exception 'Expected SR002'; exception when sqlstate 'SR002' then null;
  end; end $$;`));
  console.log("PASS: ejecución, Papelera/restauración, concurrencia y sesión revocada.");
} finally {
  // Only a database successfully created by THIS run is eligible for cleanup.
  if (created && /^sr_span_place_test_[a-f0-9]{32}$/.test(database)) {
    run(["dropdb", "-U", "postgres", database]);
    console.log(`Base de prueba eliminada: ${database}. Ningún dato del usuario fue modificado.`);
  }
}
