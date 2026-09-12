// Real GoTrue + PostgREST + production Edge wrappers. No remote project access.
// Only UUID-named resources created by this invocation may be removed.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  randomUUID,
  randomBytes,
  sign,
  generateKeyPairSync,
} from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const suffix = randomUUID().replaceAll("-", "");
const database = `sr_auth_test_${suffix}`;
const dbContainer = "supabase_db_sistema-r";
const resources = [];
let created = false,
  edge,
  gateway;
const root = fileURLToPath(new URL("../../", import.meta.url));
function docker(args, input) {
  const r = spawnSync("docker", args, {
    input,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
  });
  // Never echo docker arguments, environment, SQL rows or authentication responses.
  if (r.error || r.status !== 0)
    throw Error(
      `Docker ${args[0]} failed: ${(r.stderr || r.error?.message || "").split("\n").find((x) => x.includes("ERROR:")) || "inspect local service configuration"}`,
    );
  return r.stdout;
}
const inspect = (name) => JSON.parse(docker(["inspect", name]))[0];
const envOf = (config) =>
  Object.fromEntries(
    config.Config.Env.map((x) => {
      const i = x.indexOf("=");
      return [x.slice(0, i), x.slice(i + 1)];
    }),
  );
function sql(input) {
  return docker(
    [
      "exec",
      "-i",
      dbContainer,
      "psql",
      "-XqAt",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "supabase_admin",
      "-d",
      database,
    ],
    input,
  );
}
function jwt(role, privateKey, kid) {
  const head = Buffer.from(
    JSON.stringify({ alg: "ES256", typ: "JWT", kid }),
  ).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      role,
      iss: "supabase",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url");
  return `${head}.${body}.${sign("sha256", Buffer.from(`${head}.${body}`), { key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url")}`;
}
async function waitFor(check, label) {
  for (let i = 0; i < 120; i++) {
    if (await check().catch(() => false)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw Error(`Timeout: ${label}`);
}
function startContainer(name, image, network, port, vars) {
  docker([
    "run",
    "-d",
    "--name",
    name,
    "--network",
    network,
    "-p",
    `127.0.0.1::${port}`,
    ...Object.entries(vars).flatMap(([k, v]) => ["-e", `${k}=${v}`]),
    image,
  ]);
  resources.push(name);
  const assigned =
    inspect(name).NetworkSettings.Ports[`${port}/tcp`][0].HostPort;
  return `http://127.0.0.1:${assigned}`;
}
const password = () => `Test!a9-${randomBytes(18).toString("hex")}`;
const ok = (result, label) => {
  if (result.error)
    throw Error(
      `${label}: ${result.error.code || result.error.name} (${result.error.status || "no status"}) ${result.error.message?.replace(/eyJ[A-Za-z0-9._-]+/g, "[redacted]")}`,
    );
  return result.data;
};
let checks = 0;
const pass = (label) => {
  checks++;
  console.log(`PASS ${checks}: ${label}`);
};
try {
  const authConfig = inspect("supabase_auth_sistema-r"),
    restConfig = inspect("supabase_rest_sistema-r");
  const network = Object.keys(inspect(dbContainer).NetworkSettings.Networks)[0];
  docker([
    "exec",
    dbContainer,
    "createdb",
    "-U",
    "supabase_admin",
    "--template=template0",
    "--owner=postgres",
    database,
  ]);
  created = true;
  sql(
    'create schema extensions; create extension pgcrypto with schema extensions; create extension "uuid-ossp" with schema extensions;',
  );
  // Copy Auth structure and its migration ledger ONLY, never users or sessions.
  sql(
    docker([
      "exec",
      dbContainer,
      "pg_dump",
      "-U",
      "supabase_admin",
      "-d",
      "postgres",
      "--schema-only",
      "--schema=auth",
    ]),
  );
  sql(
    docker([
      "exec",
      dbContainer,
      "pg_dump",
      "-U",
      "supabase_admin",
      "-d",
      "postgres",
      "--data-only",
      "--table=auth.schema_migrations",
    ]),
  );
  sql(
    "grant usage on schema public,auth,extensions to anon,authenticated,service_role;",
  );
  for (const name of readdirSync(`${root}/supabase/migrations`)
    .filter((x) => x.endsWith(".sql"))
    .sort()) {
    // Match cloud migrations owned by postgres, not the cluster superuser.
    sql(
      `set role postgres;\n${readFileSync(`${root}/supabase/migrations/${name}`, "utf8")}`,
    );
  }
  assert.equal(sql("select count(*) from auth.users").trim(), "0");
  pass("empty isolated DB with full migrations, no team records");
  const secret = randomBytes(48).toString("base64url");
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });
  const kid = randomUUID();
  const anon = jwt("anon", privateKey, kid),
    service = jwt("service_role", privateKey, kid);
  const pub = {
    ...publicKey.export({ format: "jwk" }),
    kid,
    alg: "ES256",
    use: "sig",
  };
  const priv = {
    ...privateKey.export({ format: "jwk" }),
    kid,
    alg: "ES256",
    use: "sig",
    key_ops: ["sign", "verify"],
  };
  const authEnv = envOf(authConfig),
    restEnv = envOf(restConfig);
  const authDb = new URL(authEnv.GOTRUE_DB_DATABASE_URL);
  authDb.pathname = `/${database}`;
  const restDb = new URL(restEnv.PGRST_DB_URI);
  restDb.pathname = `/${database}`;
  let authUrl, restUrl, edgeUrl;
  gateway = createServer(async (req, res) => {
    try {
      let target,
        path = req.url;
      if (path.startsWith("/auth/v1/")) {
        target = authUrl;
        path = path.slice(8);
      } else if (path.startsWith("/rest/v1/")) {
        target = restUrl;
        path = path.slice(8);
      } else if (path.startsWith("/functions/v1/")) {
        target = edgeUrl;
      }
      if (!target) {
        res.writeHead(404).end();
        return;
      }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const headers = { ...req.headers };
      delete headers.host;
      delete headers["content-length"];
      if (!headers.authorization)
        headers.authorization = `Bearer ${headers.apikey || anon}`;
      const upstream = await fetch(target + path, {
        method: req.method,
        headers,
        body: chunks.length ? Buffer.concat(chunks) : undefined,
        signal: AbortSignal.timeout(20000),
      });
      res.writeHead(upstream.status, {
        "content-type":
          upstream.headers.get("content-type") || "application/json",
      });
      res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      res.writeHead(502).end('{"error":"isolated upstream unavailable"}');
    }
  });
  await new Promise((r) => gateway.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${gateway.address().port}`;
  authUrl = startContainer(
    `sr_auth_${suffix}`,
    authConfig.Config.Image,
    network,
    9999,
    {
      GOTRUE_API_HOST: "0.0.0.0",
      GOTRUE_API_PORT: "9999",
      API_EXTERNAL_URL: `${url}/auth/v1`,
      GOTRUE_SITE_URL: url,
      GOTRUE_DB_DRIVER: "postgres",
      GOTRUE_DB_DATABASE_URL: authDb.toString(),
      GOTRUE_JWT_SECRET: secret,
      GOTRUE_JWT_KEYS: JSON.stringify([priv]),
      GOTRUE_JWT_AUD: "authenticated",
      GOTRUE_JWT_ADMIN_ROLES: "service_role",
      GOTRUE_JWT_DEFAULT_GROUP_NAME: "authenticated",
      GOTRUE_JWT_EXP: "3600",
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true",
      GOTRUE_MAILER_AUTOCONFIRM: "true",
      GOTRUE_DISABLE_SIGNUP: "true",
      GOTRUE_PASSWORD_MIN_LENGTH: "10",
      GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED: "true",
      GOTRUE_RATE_LIMIT_TOKEN_REFRESH: "1000",
      GOTRUE_RATE_LIMIT_VERIFY: "1000",
    },
  );
  restUrl = startContainer(
    `sr_rest_${suffix}`,
    restConfig.Config.Image,
    network,
    3000,
    {
      PGRST_DB_URI: restDb.toString(),
      PGRST_DB_SCHEMAS: "public",
      PGRST_DB_ANON_ROLE: "anon",
      PGRST_SERVER_PORT: "3000",
      PGRST_JWT_SECRET: JSON.stringify({
        keys: [
          pub,
          {
            kty: "oct",
            alg: "HS256",
            k: Buffer.from(secret).toString("base64url"),
          },
        ],
      }),
    },
  );
  await waitFor(
    async () => (await fetch(`${authUrl}/health`)).ok,
    "Auth health",
  );
  await waitFor(
    async () =>
      (await fetch(`${url}/rest/v1/`, { headers: { apikey: anon } })).ok,
    "PostgREST health",
  );
  const denoCandidates =
    process.platform === "win32"
      ? (spawnSync("where.exe", ["deno"], { encoding: "utf8" }).stdout || "")
          .trim()
          .split(/\r?\n/)
          .flatMap((p) => [p, resolve(dirname(p), "../deno/deno.exe")])
      : [];
  const deno =
    process.env.SISTEMA_R_DENO_BINARY ||
    (process.platform === "win32"
      ? denoCandidates.find((x) => x.endsWith(".exe") && existsSync(x))
      : "deno");
  assert.ok(
    deno,
    "Run through npm run test:auth:integration or supply SISTEMA_R_DENO_BINARY",
  );
  edge = spawn(
    deno,
    [
      "run",
      "--no-lock",
      "--node-modules-dir=none",
      "--allow-env",
      "--allow-net",
      "../supabase/functions/_integration/serve.ts",
    ],
    {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        SUPABASE_URL: url,
        SUPABASE_PUBLISHABLE_KEY: anon,
        SUPABASE_SECRET_KEY: service,
        SUPABASE_JWKS: JSON.stringify({ keys: [pub] }),
        SISTEMA_R_USERNAME_DOMAIN: "auth-test.invalid",
      },
    },
  );
  let edgeOutput = "";
  edge.stdout.on("data", (c) => {
    edgeOutput += c;
    const m = edgeOutput.match(/PORT=(\d+)/);
    if (m) edgeUrl = `http://127.0.0.1:${m[1]}`;
  });
  edge.stderr.on("data", () => {});
  await waitFor(async () => Boolean(edgeUrl), "Edge wrapper startup");
  const client = (key) =>
    createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  const adminService = client(service);
  const bootPassword = password();
  const boot = ok(
    await adminService.auth.admin.createUser({
      email: "bootstrap@auth-test.invalid",
      password: bootPassword,
      email_confirm: true,
    }),
    "bootstrap Auth",
  ).user;
  sql(
    `insert into public.profiles(id,username,display_name,role) values ('${boot.id}','bootstrap','Test Admin','admin')`,
  );
  async function login(email, pw, register = true) {
    const c = client(anon);
    ok(await c.auth.signInWithPassword({ email, password: pw }), "sign in");
    if (register) ok(await c.rpc("register_app_session"), "register session");
    return c;
  }
  const admin = await login(boot.email, bootPassword);
  async function invoke(c, name, body) {
    const token = (await c.auth.getSession()).data.session?.access_token;
    const r = await fetch(`${url}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        apikey: anon,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json() };
  }
  const adminCall = (c, body) => invoke(c, "admin-accounts", body);
  const changeCall = (c, pw) =>
    invoke(c, "change-temporary-password", { password: pw });
  const anonymous = await adminCall(client(anon), { action: "create" });
  assert.ok([401, 403].includes(anonymous.status));
  pass("production Edge wrapper rejects unauthenticated caller");
  const users = {};
  for (const [name, role] of [
    ["operator", "operario"],
    ["other", "operario"],
    ["customer", "aunor"],
    ["manager", "admin"],
  ]) {
    const temporary = password();
    const result = await adminCall(admin, {
      action: "create",
      username: name,
      displayName: `Test ${name}`,
      role,
      isBursonOperator: false,
      canCreateOwnActivities: role === "operario",
      temporaryPassword: temporary,
    });
    assert.equal(result.status, 201, `create ${role}: ${result.body.code}`);
    const c = await login(`${name}@auth-test.invalid`, temporary);
    const profile = ok(
      await c
        .from("profiles")
        .select("must_change_password")
        .eq("id", result.body.profileId)
        .single(),
      "pending profile",
    );
    assert.equal(profile.must_change_password, true);
    assert.equal((await adminCall(c, { action: "create" })).status, 403);
    assert.equal((await changeCall(c, temporary)).body.code, "same_password");
    assert.equal((await changeCall(c, "short")).body.code, "invalid_password");
    const permanent = password();
    const changed = await changeCall(c, permanent);
    assert.equal(changed.body.ok, true, `change ${role}: ${changed.body.code}`);
    assert.equal(changed.body.fingerprintCleanupPending, false);
    assert.ok(
      (await c.rpc("register_app_session")).error,
      "old session must fail after change",
    );
    const current = await login(`${name}@auth-test.invalid`, permanent);
    users[name] = {
      id: result.body.profileId,
      email: `${name}@auth-test.invalid`,
      password: permanent,
      client: current,
    };
    assert.equal(
      ok(
        await current
          .from("profiles")
          .select("must_change_password")
          .eq("id", result.body.profileId)
          .single(),
        "completed profile",
      ).must_change_password,
      false,
    );
    pass(
      `${role}/${name}: create, temporary login, policy, change, metadata cleanup and new session`,
    );
  }
  const self = await adminCall(admin, {
    action: "reset-password",
    profileId: boot.id,
    temporaryPassword: password(),
  });
  assert.equal(self.body.code, "self_reset_not_allowed");
  pass("administrator self-reset refused");
  for (const name of ["operator", "customer"]) {
    assert.equal(
      (
        await adminCall(users[name].client, {
          action: "reset-password",
          profileId: users.other.id,
          temporaryPassword: password(),
        })
      ).status,
      403,
    );
  }
  pass("operator and Aunor cannot administer accounts");
  // Security regression: login exists in Auth but was never registered in app_sessions.
  const dormant = await login(
    users.operator.email,
    users.operator.password,
    false,
  );
  const resetPassword = password();
  const reset = await adminCall(admin, {
    action: "reset-password",
    profileId: users.operator.id,
    temporaryPassword: resetPassword,
  });
  assert.equal(reset.body.ok, true, `reset: ${reset.body.code}`);
  assert.ok((await dormant.rpc("register_app_session")).error);
  assert.ok((await users.operator.client.rpc("register_app_session")).error);
  const refreshed = await dormant.auth.refreshSession();
  if (!refreshed.error)
    assert.ok(
      (await dormant.rpc("register_app_session")).error,
      "refresh must not bypass session creation boundary",
    );
  assert.ok(
    (
      await client(anon).auth.signInWithPassword({
        email: users.operator.email,
        password: users.operator.password,
      })
    ).error,
  );
  const resetClient = await login(users.operator.email, resetPassword);
  const finalPassword = password();
  assert.equal((await changeCall(resetClient, finalPassword)).body.ok, true);
  users.operator.client = await login(users.operator.email, finalPassword);
  users.operator.password = finalPassword;
  pass(
    "reset revokes registered, unregistered and refreshed old sessions; new credentials work",
  );
  // Fixtures are private to this disposable database. Test RLS through HTTP.
  const activity = randomUUID(),
    otherActivity = randomUUID();
  for (const [id, owner] of [
    [activity, users.operator],
    [otherActivity, users.other],
  ])
    sql(
      `insert into public.activities(id,origin,created_by,created_by_role,responsible_id,responsible_name,type,title,description) values ('${id}','operario','${boot.id}','admin','${owner.id}','Test operator','Grabación','Test activity','Private test description')`,
    );
  assert.equal(
    ok(await admin.from("activities").select("id"), "admin activities").length,
    2,
  );
  for (const name of ["operator", "other"]) {
    const rows = ok(
      await users[name].client.from("activities").select("id"),
      "operator activities",
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, name === "operator" ? activity : otherActivity);
  }
  assert.equal(
    ok(
      await users.customer.client.from("activities").select("id"),
      "Aunor private activities",
    ).length,
    0,
  );
  assert.equal(
    ok(
      await users.customer.client.from("aunor_activities").select("id"),
      "Aunor unpublished",
    ).length,
    0,
  );
  const publish = {
    p_command: "publish",
    p_activity_id: activity,
    p_request_id: randomUUID(),
    p_payload: {
      expectedVersion: 0,
      summary: "Test published summary",
      serviceId: "cobertura",
      notPerformedReason: "",
    },
  };
  for (const name of ["operator", "customer"])
    assert.equal(
      (await users[name].client.rpc("aunor_mutate_v1", publish)).error?.code,
      "SR002",
    );
  ok(await admin.rpc("aunor_mutate_v1", publish), "publish as admin");
  const published = ok(
    await users.customer.client.from("aunor_activities").select("*"),
    "Aunor publication",
  );
  assert.equal(published.length, 1);
  assert.equal(published[0].id, activity);
  assert.equal("operator_opinion" in published[0], false);
  pass(
    "HTTP RLS: admin visibility, operator ownership, Aunor only explicitly published projection",
  );
  const message = {
    p_command: "message",
    p_activity_id: activity,
    p_request_id: randomUUID(),
    p_payload: { body: "Test Aunor message" },
  };
  // External chat was intentionally retired: do not revive it in fixtures.
  assert.equal(
    (await users.customer.client.rpc("aunor_mutate_v1", message)).error?.code,
    "SR002",
  );
  assert.equal(
    (await users.customer.client.from("aunor_messages").select("id")).error?.code,
    "42501",
  );
  assert.equal(
    (
      await users.operator.client.rpc("aunor_mutate_v1", {
        ...message,
        p_request_id: randomUUID(),
      })
    ).error?.code,
    "SR002",
  );
  sql(
    `update public.activities set status='Entregada',material_link='https://example.invalid/test.mp4',delivered_at=now() where id='${activity}'`,
  );
  ok(
    await admin.rpc("aunor_mutate_v1", {
      ...publish,
      p_command: "delivery",
      p_request_id: randomUUID(),
      p_payload: { expectedActivityVersion: 1, label: "Test delivery" },
    }),
    "admin delivery",
  );
  const delivery = ok(
    await users.customer.client
      .from("aunor_deliveries")
      .select("id,version")
      .single(),
    "published delivery",
  );
  const confirm = {
    ...publish,
    p_command: "confirm-delivery",
    p_request_id: randomUUID(),
    p_payload: {
      objectId: delivery.id,
      version: delivery.version,
      acknowledged: true,
    },
  };
  assert.equal(
    (await admin.rpc("aunor_mutate_v1", confirm)).error?.code,
    "SR002",
  );
  ok(
    await users.customer.client.rpc("aunor_mutate_v1", confirm),
    "customer confirmation",
  );
  ok(await users.customer.client.rpc("aunor_mutate_v1", confirm), "idempotent confirmation retry");
  assert.ok(
    ok(
      await users.customer.client
        .from("aunor_deliveries")
        .select("confirmed_at")
        .single(),
      "confirmed delivery",
    ).confirmed_at,
  );
  pass(
    "Aunor retired-chat denial, delivery, customer-only confirmation and idempotency",
  );
  const resetArgs={p_activity_id:activity,p_expected_version:1,p_reason:"Corrección integrada aislada"};
  assert.equal((await users.operator.client.rpc("reset_activity_v1",resetArgs)).error?.code,"SR002");
  ok(await admin.rpc("reset_activity_v1",resetArgs),"admin reset through HTTP");
  assert.equal((await admin.rpc("reset_activity_v1",resetArgs)).error?.code,"SR001");
  const restarted=ok(await admin.from("activities").select("status,material_link,delivered_at").eq("id",activity).single(),"reset record");
  assert.equal(restarted.status,"Programada");assert.equal(restarted.delivered_at,null);assert.equal(restarted.material_link,"https://example.invalid/test.mp4");
  const historicDelivery=ok(await users.customer.client.from("aunor_deliveries").select("is_current,confirmed_at").single(),"preserved confirmation");
  assert.equal(historicDelivery.is_current,false);assert.ok(historicDelivery.confirmed_at);
  // Complete the restarted fixture through the responsible operator before
  // testing deactivation: production correctly rejects open assignments.
  ok(await users.operator.client.rpc("advance_activity_v1",{p_activity_id:activity,p_expected_version:2}),"restart execution");
  ok(await users.operator.client.rpc("advance_activity_v1",{p_activity_id:activity,p_expected_version:3}),"deliver restarted execution");
  pass("Admin reset via HTTP preserves material and Aunor confirmation as historical evidence");
  assert.equal(
    (
      await users.operator.client
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", users.operator.id)
    ).error?.code,
    "42501",
  );
  assert.equal(
    (
      await users.customer.client.rpc("begin_credential_operation_v1", {
        p_profile_id: users.customer.id,
        p_actor_id: users.customer.id,
        p_operation_id: randomUUID(),
      })
    ).error?.code,
    "42501",
  );
  pass("direct role escalation and service-only credential RPC denied");
  const orphan = ok(
    await adminService.auth.admin.createUser({
      email: "orphan@auth-test.invalid",
      password: password(),
      email_confirm: true,
    }),
    "orphan fixture",
  ).user;
  const recovered = await adminCall(admin, {
    action: "create",
    username: "orphan",
    displayName: "Test orphan",
    role: "operario",
    isBursonOperator: false,
    canCreateOwnActivities: false,
    temporaryPassword: password(),
  });
  assert.equal(recovered.status, 201, `orphan repair: ${recovered.body.code}`);
  assert.equal(recovered.body.profileId, orphan.id);
  const duplicate = await adminCall(admin, {
    action: "create",
    username: "orphan",
    displayName: "Test orphan",
    role: "operario",
    isBursonOperator: false,
    canCreateOwnActivities: false,
    temporaryPassword: password(),
  });
  assert.equal(duplicate.body.code, "account_exists");
  const duplicateAunor = await adminCall(admin, {
    action: "create",
    username: "extra-customer",
    displayName: "Test extra",
    role: "aunor",
    isBursonOperator: false,
    canCreateOwnActivities: false,
    temporaryPassword: password(),
  });
  assert.equal(duplicateAunor.body.code, "aunor_account_exists");
  assert.equal(
    sql(
      "select count(*) from auth.users where email='extra-customer@auth-test.invalid'",
    ).trim(),
    "0",
  );
  pass(
    "orphan Auth recovery, duplicate account protection and duplicate Aunor cleanup",
  );
  const concurrent = await Promise.all(
    [1, 2].map(() =>
      adminCall(admin, {
        action: "reset-password",
        profileId: users.other.id,
        temporaryPassword: password(),
      }),
    ),
  );
  assert.deepEqual(concurrent.map((x) => x.status).sort(), [200, 409]);
  assert.equal(
    concurrent.find((x) => x.status === 409).body.code,
    "credential_operation_busy",
  );
  pass("overlapping real password resets serialize per account");
  assert.equal(
    sql("select count(*) from private.credential_operations").trim(),
    "0",
  );
  pass("all successful credential operations released their locks");
  if (process.argv.includes("--browser")) {
    const { verifyAuthBrowser } = await import("./verify-auth-browser.mjs");
    await verifyAuthBrowser({
      url,
      anon,
      users,
      admin,
      adminCall,
      password,
      pass,
    });
  }
  async function updateAccount(user, role, isActive) {
    const profile = ok(
      await admin
        .from("profiles")
        .select("updated_at,display_name")
        .eq("id", user.id)
        .single(),
      "account version",
    );
    ok(
      await admin.rpc("update_account_v1", {
        p_profile_id: user.id,
        p_expected_updated_at: profile.updated_at,
        p_display_name: profile.display_name,
        p_role: role,
        p_is_active: isActive,
        p_is_burson_operator: false,
        p_can_create_own_activities: false,
      }),
      "update account",
    );
  }
  await updateAccount(users.manager, "operario", true);
  assert.equal(
    (await adminCall(users.manager.client, { action: "create" })).status,
    403,
  );
  assert.equal(
    (await users.manager.client.rpc("register_app_session")).error?.code,
    "SR002",
  );
  const demoted = await login(users.manager.email, users.manager.password);
  assert.equal((await adminCall(demoted, { action: "create" })).status, 403);
  await updateAccount(users.operator, "operario", false);
  assert.equal(
    (await users.operator.client.rpc("register_app_session")).error?.code,
    "SR002",
  );
  assert.equal(
    ok(
      await users.operator.client.from("activities").select("id"),
      "disabled visibility",
    ).length,
    0,
  );
  await updateAccount(users.operator, "operario", true);
  assert.equal(
    (await users.operator.client.rpc("register_app_session")).error?.code,
    "SR002",
  );
  const reactivated = await login(
    users.operator.email,
    users.operator.password,
  );
  assert.equal(
    ok(
      await reactivated.from("activities").select("id"),
      "reactivated visibility",
    ).length,
    1,
  );
  pass(
    "admin demotion, account disable/reactivation and old-session rejection",
  );
  // All destructive scenarios below use this run's UUID database and users.
  const eraseCall=(c,body)=>invoke(c,"admin-erasure",body);
  const disposableId=randomUUID();
  sql(`insert into public.activities(id,created_by,created_by_role,responsible_id,responsible_name,type,title,description,status,material_link,operator_opinion) values('${disposableId}','${boot.id}','admin','${users.operator.id}','Test operator','Grabación','Disposable restart','Isolated erasure test','En proceso','https://example.com/old-material','Old opinion'); insert into public.activity_date_spans(activity_id,position,start_date,end_date) values('${disposableId}',1,'2026-09-11','2026-09-11');`);
  const v2Restart=ok(await admin.rpc("restart_activity_v2",{p_activity_id:disposableId,p_expected_version:1,p_reason:"Isolated restart"}),"restart v2")[0];
  assert.notEqual(v2Restart.activity_id,disposableId);
  assert.equal(sql(`select status||'|'||material_link from public.activities where id='${v2Restart.activity_id}'`).trim(),"Programada|");
  assert.equal(sql(`select count(*) from public.activities where id='${disposableId}' and deleted_at is not null and material_link<>''`).trim(),"1");
  assert.ok((await reactivated.rpc("preview_erasure_v1",{p_kind:"trash",p_target:null})).error);
  assert.ok((await admin.rpc("execute_erasure_v1",{p_actor:boot.id,p_session:randomUUID(),p_kind:"trash",p_target:null,p_fingerprint:"0".repeat(64)})).error);
  let impact=ok(await admin.rpc("preview_erasure_v1",{p_kind:"trash",p_target:null}),"trash preview");
  const payload=()=>({kind:"trash",target:null,fingerprint:impact.fingerprint,password:bootPassword,confirmation:"ELIMINAR DEFINITIVAMENTE"});
  assert.ok([401,403].includes((await eraseCall(client(anon),payload())).status));
  assert.equal((await eraseCall(reactivated,payload())).status,403);
  assert.equal((await eraseCall(admin,{...payload(),password:"NotTheAdminPassword!"})).body.code,"invalid_admin_password");
  sql(`update public.activities set description='Changed after preview' where id='${disposableId}'`);
  assert.equal((await eraseCall(admin,payload())).body.code,"preview_changed");
  assert.equal(sql(`select count(*) from public.activities where id='${disposableId}'`).trim(),"1");
  impact=ok(await admin.rpc("preview_erasure_v1",{p_kind:"trash",p_target:null}),"fresh trash preview");
  const purged=await eraseCall(admin,payload());
  assert.equal(purged.status,200,`trash purge: ${purged.body.code}`);
  assert.equal(sql(`select count(*) from public.activities where id='${disposableId}'`).trim(),"0");
  assert.equal(sql(`select count(*) from public.activities where id='${v2Restart.activity_id}'`).trim(),"1");
  assert.equal(sql(`select count(*) from private.record_history where coalesce(old_record::text,'')||coalesce(new_record::text,'') like '%${disposableId}%'`).trim(),"0");
  ok(await admin.rpc("erasure_identity_v1"),"working Admin session preserved after reauthentication");
  pass("restart v2 and password-gated purge: wrong password, roles, stale preview, retained live activity and no old snapshots");
  const accountWork=randomUUID();
  sql(`insert into public.activities(id,created_by,created_by_role,responsible_id,responsible_name,type,title,description,status,material_link,delivered_at) values('${accountWork}','${boot.id}','admin','${users.manager.id}','Test manager','Grabación','Disposable account work','Isolated account erasure','Entregada','https://example.com/disposable',now())`);
  await updateAccount(users.manager,"operario",false);
  assert.ok((await adminService.auth.admin.deleteUser(users.manager.id,false)).error,"Auth deletion without password-gated request must fail");
  const accountImpact=ok(await admin.rpc("preview_erasure_v1",{p_kind:"account",p_target:users.manager.id}),"account preview");
  assert.ok(accountImpact.activities.some(item=>item.id===accountWork));
  // Failure after the app-data trigger must roll back BOTH Auth and business rows.
  sql(`create function private.test_erasure_rollback() returns trigger language plpgsql as $$ begin if old.id='${users.manager.id}' then raise exception 'isolated rollback probe'; end if; return old; end $$; create trigger test_erasure_rollback after delete on auth.users for each row execute function private.test_erasure_rollback();`);
  const interrupted=await eraseCall(admin,{kind:"account",target:users.manager.id,fingerprint:accountImpact.fingerprint,password:bootPassword,confirmation:"ELIMINAR DEFINITIVAMENTE"});
  assert.equal(interrupted.body.code,"account_erasure_failed");
  assert.equal(sql(`select count(*) from public.profiles where id='${users.manager.id}'`).trim(),"1");
  assert.equal(sql(`select count(*) from public.activities where id='${accountWork}'`).trim(),"1");
  ok(await adminService.auth.admin.getUserById(users.manager.id),"Auth account retained after rollback");
  sql("drop trigger test_erasure_rollback on auth.users; drop function private.test_erasure_rollback();");
  const erased=await eraseCall(admin,{kind:"account",target:users.manager.id,fingerprint:accountImpact.fingerprint,password:bootPassword,confirmation:"ELIMINAR DEFINITIVAMENTE"});
  assert.equal(erased.status,200,`account purge: ${erased.body.code}`);
  assert.ok((await adminService.auth.admin.getUserById(users.manager.id)).error);
  assert.equal(sql(`select count(*) from public.profiles where id='${users.manager.id}'`).trim(),"0");
  assert.equal(sql(`select count(*) from public.activities where id='${accountWork}'`).trim(),"0");
  assert.equal(sql(`select count(*) from private.record_history where coalesce(old_record::text,'')||coalesce(new_record::text,'') like '%${users.manager.id}%'`).trim(),"0");
  assert.equal(sql(`select count(*) from public.profiles where id='${boot.id}'`).trim(),"1");
  assert.ok((await demoted.rpc("register_app_session")).error);
  const remaining=ok(await admin.rpc("preview_erasure_v1",{p_kind:"trash",p_target:null}),"remaining trash");
  const wrong={kind:"trash",target:null,fingerprint:remaining.fingerprint,password:"WrongPassword!",confirmation:"ELIMINAR DEFINITIVAMENTE"};
  await eraseCall(admin,wrong);
  assert.equal((await eraseCall(admin,wrong)).status,429);
  pass("official Auth delete atomically erases disabled account and related work, invalidates old access, and throttles password attempts");
  console.log(
    `PASS: ${checks} integrated scenarios (real local Auth/REST; no remote writes)`,
  );
} finally {
  if (edge) {
    edge.kill();
    await new Promise((r) => {
      if (edge.exitCode !== null) return r();
      edge.once("exit", r);
      setTimeout(r, 3000);
    });
  }
  if (gateway) {
    gateway.closeAllConnections();
    await new Promise((r) => gateway.close(r));
  }
  for (const name of resources.reverse())
    if (new RegExp(`^sr_(auth|rest)_${suffix}$`).test(name))
      docker(["rm", "-f", name]);
  if (created && /^sr_auth_test_[a-f0-9]{32}$/.test(database))
    docker(["exec", dbContainer, "dropdb", "-U", "supabase_admin", database]);
  console.log(
    "Cleanup: removed only this run's disposable containers and database.",
  );
}
