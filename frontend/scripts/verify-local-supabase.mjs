import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..", "..");
const supabaseConfigPath = join(repositoryRoot, "supabase", "config.toml");
const commandTimeoutMs = 180_000;
const requestTimeoutMs = 12_000;
const excludedServices = [
  "realtime",
  "storage-api",
  "imgproxy",
  "mailpit",
  "postgres-meta",
  "studio",
  "edge-runtime",
  "logflare",
  "vector",
  "supavisor",
].join(",");

let checksPassed = 0;
let localDatabaseWasReset = false;
let primaryFailure;

function fail(message) {
  throw new Error(message);
}

function commandResult(command, args, options = {}) {
  const usesCommandShell =
    process.platform === "win32" && command.toLowerCase().endsWith(".cmd");
  const executable = usesCommandShell
    ? (process.env.ComSpec ?? "cmd.exe")
    : command;
  const executableArguments = usesCommandShell
    ? ["/d", "/s", "/c", command, ...args]
    : args;

  return spawnSync(executable, executableArguments, {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: options.env ?? process.env,
    input: options.input,
    maxBuffer: 16 * 1024 * 1024,
    timeout: commandTimeoutMs,
    windowsHide: true,
  });
}

function commandSucceeded(result) {
  return !result.error && result.status === 0 && !result.signal;
}

function dockerCandidates() {
  const candidates = ["docker"];
  const localAppData = process.env.LOCALAPPDATA;
  const programFiles = process.env.ProgramFiles;

  if (localAppData) {
    candidates.push(
      join(
        localAppData,
        "Programs",
        "DockerDesktop",
        "resources",
        "bin",
        "docker.exe",
      ),
      join(
        localAppData,
        "Programs",
        "Docker",
        "Docker",
        "resources",
        "bin",
        "docker.exe",
      ),
    );
  }
  if (programFiles) {
    candidates.push(
      join(
        programFiles,
        "Docker",
        "Docker",
        "resources",
        "bin",
        "docker.exe",
      ),
    );
  }

  return [...new Set(candidates)];
}

function findDocker() {
  for (const candidate of dockerCandidates()) {
    if (candidate !== "docker" && !existsSync(candidate)) continue;
    const result = commandResult(candidate, [
      "version",
      "--format",
      "{{.Server.Version}}",
    ]);
    if (commandSucceeded(result) && result.stdout.trim()) return candidate;
  }

  fail(
    "Docker Desktop no esta operativo. Abre Docker Desktop y vuelve a ejecutar la prueba.",
  );
}

function environmentWithDocker(dockerCommand) {
  if (dockerCommand === "docker") return process.env;
  const dockerDirectory = dirname(dockerCommand);
  const pathName =
    Object.keys(process.env).find((name) => name.toLowerCase() === "path") ??
    "PATH";
  return {
    ...process.env,
    [pathName]: `${dockerDirectory}${delimiter}${process.env[pathName] ?? ""}`,
  };
}

function supabaseCommandName() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

function runSupabase(args, dockerEnvironment, description) {
  const forbidden = args.some(
    (argument) =>
      argument === "--linked" ||
      argument === "link" ||
      argument === "push" ||
      /^https?:\/\//i.test(argument),
  );
  if (forbidden) fail(`Comando remoto bloqueado durante ${description}.`);

  const result = commandResult(
    supabaseCommandName(),
    ["--yes", "supabase", ...args],
    { env: dockerEnvironment },
  );
  if (!commandSucceeded(result)) {
    const reason = result.error?.code
      ? `error ${result.error.code}`
      : result.signal
        ? `senal ${result.signal}`
        : `codigo ${result.status ?? "desconocido"}`;
    fail(
      `No se pudo ${description} (${reason}); la salida sensible fue ocultada.`,
    );
  }
  return result.stdout;
}

function readProjectId() {
  const config = readFileSync(supabaseConfigPath, "utf8");
  const match = config.match(/^project_id\s*=\s*"([a-zA-Z0-9_-]+)"\s*$/m);
  if (!match) fail("supabase/config.toml no contiene un project_id seguro.");
  return match[1];
}

function assertLocalUrl(rawValue, name, protocols, options = {}) {
  if (typeof rawValue !== "string" || !rawValue) {
    fail(`Supabase local no entrego ${name}.`);
  }

  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch {
    fail(`${name} no es una URL valida.`);
  }

  if (
    parsed.hostname !== "127.0.0.1" ||
    !protocols.includes(parsed.protocol) ||
    (!options.allowCredentials && (parsed.username || parsed.password))
  ) {
    fail(`${name} no apunta exclusivamente a 127.0.0.1.`);
  }
  return parsed;
}

function readLocalStatus(dockerEnvironment) {
  const rawStatus = runSupabase(
    ["status", "-o", "json"],
    dockerEnvironment,
    "leer el estado local de Supabase",
  );
  let status;
  try {
    status = JSON.parse(rawStatus);
  } catch {
    fail("Supabase CLI no devolvio un estado JSON valido.");
  }

  const apiUrl = assertLocalUrl(status.API_URL, "API_URL", ["http:"]);
  assertLocalUrl(status.REST_URL, "REST_URL", ["http:"]);
  assertLocalUrl(
    status.DB_URL,
    "DB_URL",
    ["postgres:", "postgresql:"],
    { allowCredentials: true },
  );

  const publicKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
  const serviceRoleKey = status.SERVICE_ROLE_KEY;
  if (!publicKey || !serviceRoleKey) {
    fail("Supabase local no entrego las claves efimeras requeridas.");
  }

  return {
    apiOrigin: apiUrl.origin,
    publicKey,
    serviceRoleKey,
  };
}

function resetLocalDatabase(dockerEnvironment, purpose) {
  runSupabase(
    ["db", "reset", "--local", "--no-seed"],
    dockerEnvironment,
    purpose,
  );
}

function ensureDatabaseContainer(dockerCommand, projectId) {
  const expectedName = `supabase_db_${projectId}`;
  const result = commandResult(dockerCommand, [
    "ps",
    "--filter",
    `name=^/${expectedName}$`,
    "--filter",
    "status=running",
    "--format",
    "{{.Names}}",
  ]);
  if (!commandSucceeded(result) || result.stdout.trim() !== expectedName) {
    fail("No se encontro el contenedor PostgreSQL local esperado.");
  }
  return expectedName;
}

function runPsql(dockerCommand, containerName, sql) {
  const result = commandResult(
    dockerCommand,
    [
      "exec",
      "-i",
      containerName,
      "psql",
      "-X",
      "-q",
      "--set",
      "ON_ERROR_STOP=1",
      "--username",
      "postgres",
      "--dbname",
      "postgres",
    ],
    { input: sql },
  );
  if (!commandSucceeded(result)) {
    fail("No se pudo preparar public.profiles mediante PostgreSQL local.");
  }
}

function assertUuid(value, name) {
  assert.match(
    value,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    `${name} no es un UUID valido`,
  );
  return value;
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function localFetch(local, path, options = {}) {
  if (!path.startsWith("/")) fail("La ruta local debe ser absoluta.");
  const url = new URL(path, local.apiOrigin);
  if (url.origin !== local.apiOrigin || url.hostname !== "127.0.0.1") {
    fail("Se bloqueo una solicitud que no apuntaba a Supabase local.");
  }

  const key = options.key ?? local.publicKey;
  const token = options.token ?? key;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    redirect: "error",
    signal: AbortSignal.timeout(requestTimeoutMs),
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      ...(options.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  return { data, ok: response.ok, status: response.status };
}

async function waitForLocalServices(local) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const authHealth = await localFetch(local, "/auth/v1/health", {
        token: local.publicKey,
      });
      const restHealth = await localFetch(local, "/rest/v1/", {
        token: local.publicKey,
      });
      if (authHealth.ok && restHealth.ok) return;
    } catch {
      // The local containers can briefly reject requests after db reset.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }
  fail("Auth o PostgREST local no quedaron disponibles despues del reinicio.");
}

function randomPassword() {
  return `Aa1!${randomBytes(24).toString("base64url")}`;
}

async function createAuthUser(local, label, runTag) {
  const email = `${label}-${runTag}@auth.sistema-r.invalid`;
  const password = randomPassword();
  const response = await localFetch(local, "/auth/v1/admin/users", {
    method: "POST",
    key: local.serviceRoleKey,
    token: local.serviceRoleKey,
    body: {
      email,
      password,
      email_confirm: true,
    },
  });
  assert.equal(response.ok, true, `GoTrue Admin no creo la identidad ${label}`);
  const id = assertUuid(response.data?.id, `${label}.id`);
  return { email, id, password };
}

async function login(local, identity) {
  let response = await localFetch(
    local,
    "/auth/v1/token?grant_type=password",
    {
      method: "POST",
      body: { email: identity.email, password: identity.password },
    },
  );
  if (
    !response.ok &&
    response.data?.error_code === "email_provider_disabled"
  ) {
    const generatedLink = await localFetch(
      local,
      "/auth/v1/admin/generate_link",
      {
        method: "POST",
        key: local.serviceRoleKey,
        token: local.serviceRoleKey,
        body: { email: identity.email, type: "magiclink" },
      },
    );
    assert.equal(
      generatedLink.ok,
      true,
      "GoTrue Admin no genero el acceso local alternativo",
    );
    const hashedToken =
      generatedLink.data?.hashed_token ??
      generatedLink.data?.properties?.hashed_token;
    assert.equal(typeof hashedToken, "string");
    response = await localFetch(local, "/auth/v1/verify", {
      method: "POST",
      body: { token_hash: hashedToken, type: "magiclink" },
    });
  }
  if (!response.ok) {
    const code =
      response.data?.error_code ?? response.data?.code ?? "sin-codigo";
    const message = response.data?.msg ?? response.data?.message ?? "sin-mensaje";
    fail(
      `GoTrue local rechazo una identidad temporal (HTTP ${response.status}, ${code}): ${message}`,
    );
  }
  assert.equal(typeof response.data?.access_token, "string");
  return response.data.access_token;
}

async function rpcResponse(local, token, functionName, body) {
  return localFetch(local, `/rest/v1/rpc/${functionName}`, {
    method: "POST",
    token,
    body,
  });
}

async function rpc(local, token, functionName, body) {
  const response = await rpcResponse(local, token, functionName, body);
  if (!response.ok) {
    const code = response.data?.code ?? "sin-codigo";
    const message = response.data?.message ?? "sin-mensaje";
    fail(`${functionName} fallo (${code}): ${message}`);
  }
  return response.data;
}

async function expectSqlState(
  local,
  token,
  functionName,
  body,
  expectedCode,
) {
  const response = await rpcResponse(local, token, functionName, body);
  assert.equal(response.ok, false, `${functionName} debio ser rechazado`);
  assert.equal(
    response.data?.code,
    expectedCode,
    `${functionName} no preservo SQLSTATE ${expectedCode} por PostgREST`,
  );
}

async function selectRows(local, token, table, query) {
  assert.match(table, /^[a-z_]+$/);
  const response = await localFetch(local, `/rest/v1/${table}?${query}`, {
    token,
  });
  assert.equal(response.ok, true, `RLS no permitio consultar ${table}`);
  assert.ok(Array.isArray(response.data));
  return response.data;
}

async function check(name, callback) {
  await callback();
  checksPassed += 1;
  console.log(`OK ${String(checksPassed).padStart(2, "0")} - ${name}`);
}

function firstRpcRow(value, functionName) {
  assert.ok(Array.isArray(value), `${functionName} no devolvio una lista`);
  assert.equal(value.length, 1, `${functionName} no devolvio una fila`);
  return value[0];
}

async function runSmoke(local, dockerCommand, databaseContainer) {
  const runTag = randomBytes(6).toString("hex");
  const identities = {};
  for (const label of ["admin", "operator", "other", "burson"]) {
    identities[label] = await createAuthUser(local, label, runTag);
  }

  const profileRows = [
    {
      ...identities.admin,
      username: `smoke-admin-${runTag}`,
      displayName: "Admin local",
      role: "admin",
      isBursonOperator: false,
    },
    {
      ...identities.operator,
      username: `smoke-operator-${runTag}`,
      displayName: "Operario local",
      role: "operario",
      isBursonOperator: true,
    },
    {
      ...identities.other,
      username: `smoke-other-${runTag}`,
      displayName: "Otro operario",
      role: "operario",
      isBursonOperator: false,
    },
    {
      ...identities.burson,
      username: `smoke-burson-${runTag}`,
      displayName: "Burson local",
      role: "burson",
      isBursonOperator: false,
    },
  ];
  const profileValues = profileRows
    .map(
      (profile) =>
        `(${sqlLiteral(profile.id)}::uuid, ${sqlLiteral(profile.username)}, ` +
        `${sqlLiteral(profile.displayName)}, ${sqlLiteral(profile.role)}::public.app_role, ` +
        `true, ${profile.isBursonOperator}, false, false)`,
    )
    .join(",\n");
  runPsql(
    dockerCommand,
    databaseContainer,
    `begin;
insert into public.profiles (
  id, username, display_name, role, is_active, is_burson_operator,
  can_create_own_activities, must_change_password
) values
${profileValues};
commit;
`,
  );

  const tokens = {};
  for (const label of ["admin", "operator", "other", "burson"]) {
    tokens[label] = await login(local, identities[label]);
  }

  await check("RLS bloquea el negocio antes de registrar app_session", async () => {
    const rows = await selectRows(
      local,
      tokens.admin,
      "profiles",
      "select=id",
    );
    assert.deepEqual(rows, []);
  });

  for (const label of ["admin", "operator", "other", "burson"]) {
    await rpc(local, tokens[label], "register_app_session", {});
  }

  await check("Admin ve los cuatro perfiles activos", async () => {
    const rows = await selectRows(
      local,
      tokens.admin,
      "profiles",
      "select=id,role&order=role.asc",
    );
    assert.equal(rows.length, 4);
  });

  await check("cada no-Admin solo ve su propio perfil", async () => {
    for (const label of ["operator", "other", "burson"]) {
      const rows = await selectRows(
        local,
        tokens[label],
        "profiles",
        "select=id",
      );
      assert.deepEqual(rows.map((row) => row.id), [identities[label].id]);
    }
  });

  const spans = [{ start: "2030-01-10", end: "2030-01-11" }];
  const planKey = randomUUID();
  const planBody = {
    p_idempotency_key: planKey,
    p_responsible_id: identities.operator.id,
    p_type: "Creatividad",
    p_title: "Actividad local administrada",
    p_description: "Prueba segura de planificacion y ejecucion separadas.",
    p_place: "Lima",
    p_spans: spans,
  };
  let planned;

  await check("solo Admin planifica una actividad para un operario", async () => {
    planned = firstRpcRow(
      await rpc(local, tokens.admin, "plan_activity_v1", planBody),
      "plan_activity_v1",
    );
    assertUuid(planned.activity_id, "planned.activity_id");
    assert.equal(planned.activity_version, 1);
    assert.equal(planned.replayed, false);
    await expectSqlState(
      local,
      tokens.operator,
      "plan_activity_v1",
      { ...planBody, p_idempotency_key: randomUUID() },
      "SR002",
    );
  });

  await check("la idempotencia repite igual y rechaza payload distinto", async () => {
    const replay = firstRpcRow(
      await rpc(local, tokens.admin, "plan_activity_v1", planBody),
      "plan_activity_v1",
    );
    assert.equal(replay.activity_id, planned.activity_id);
    assert.equal(replay.replayed, true);
    await expectSqlState(
      local,
      tokens.admin,
      "plan_activity_v1",
      { ...planBody, p_title: "Solicitud diferente" },
      "SR006",
    );
  });

  await check("RLS muestra la actividad solo a Admin y al responsable", async () => {
    const query = `select=id&id=eq.${planned.activity_id}`;
    assert.equal((await selectRows(local, tokens.admin, "activities", query)).length, 1);
    assert.equal(
      (await selectRows(local, tokens.operator, "activities", query)).length,
      1,
    );
    assert.deepEqual(await selectRows(local, tokens.other, "activities", query), []);
    assert.deepEqual(await selectRows(local, tokens.burson, "activities", query), []);
  });

  await check("Admin y otro operario no pueden editar la ejecucion", async () => {
    const executionBody = {
      p_activity_id: planned.activity_id,
      p_expected_version: 1,
      p_material_link: "https://example.com/material-local",
      p_operator_opinion: "Material listo para revision.",
    };
    await expectSqlState(
      local,
      tokens.admin,
      "update_execution_v1",
      executionBody,
      "SR002",
    );
    await expectSqlState(
      local,
      tokens.other,
      "update_execution_v1",
      executionBody,
      "SR002",
    );
  });

  let activityVersion = planned.activity_version;
  await check("el responsable edita ejecucion pero no planificacion", async () => {
    const updated = firstRpcRow(
      await rpc(local, tokens.operator, "update_execution_v1", {
        p_activity_id: planned.activity_id,
        p_expected_version: activityVersion,
        p_material_link: "https://example.com/material-local",
        p_operator_opinion: "Material listo para revision.",
      }),
      "update_execution_v1",
    );
    activityVersion = updated.activity_version;
    assert.equal(activityVersion, 2);
    await expectSqlState(
      local,
      tokens.operator,
      "replan_activity_v1",
      {
        p_activity_id: planned.activity_id,
        p_expected_version: activityVersion,
        p_responsible_id: identities.operator.id,
        p_type: "Creatividad",
        p_title: "Intento operario",
        p_description: "El operario no conserva campos de planificacion.",
        p_place: "Lima",
        p_spans: spans,
      },
      "SR002",
    );
  });

  await check("PostgREST conserva SQLSTATE de conflicto de version", async () => {
    await expectSqlState(
      local,
      tokens.operator,
      "update_execution_v1",
      {
        p_activity_id: planned.activity_id,
        p_expected_version: 1,
        p_material_link: "https://example.com/material-local",
        p_operator_opinion: "Version obsoleta.",
      },
      "SR001",
    );
  });

  await check("Admin conserva y modifica la planificacion", async () => {
    const replanned = firstRpcRow(
      await rpc(local, tokens.admin, "replan_activity_v1", {
        p_activity_id: planned.activity_id,
        p_expected_version: activityVersion,
        p_responsible_id: identities.operator.id,
        p_type: "Creatividad",
        p_title: "Actividad local replanificada",
        p_description: "Admin conserva el control de la planificacion.",
        p_place: "Lima Centro",
        p_spans: [{ start: "2030-01-12", end: "2030-01-12" }],
      }),
      "replan_activity_v1",
    );
    activityVersion = replanned.activity_version;
    assert.equal(activityVersion, 3);
  });

  const ownBody = {
    p_idempotency_key: randomUUID(),
    p_type: "Creatividad",
    p_title: "Actividad propia local",
    p_description: "Creacion propia controlada por permiso individual.",
    p_place: "Lima",
    p_spans: spans,
  };
  let ownActivityId;

  await check("el permiso propio empieza denegado", async () => {
    await expectSqlState(
      local,
      tokens.operator,
      "create_own_activity_v1",
      ownBody,
      "SR002",
    );
  });

  await check("otro operario no puede conceder privilegios", async () => {
    await expectSqlState(
      local,
      tokens.other,
      "set_operator_creation_permission_v1",
      { p_operator_id: identities.operator.id, p_enabled: true },
      "SR002",
    );
  });

  await check("Admin concede y el operario usa el permiso propio", async () => {
    const permission = firstRpcRow(
      await rpc(
        local,
        tokens.admin,
        "set_operator_creation_permission_v1",
        { p_operator_id: identities.operator.id, p_enabled: true },
      ),
      "set_operator_creation_permission_v1",
    );
    assert.equal(permission.can_create_own_activities, true);
    const ownActivity = firstRpcRow(
      await rpc(local, tokens.operator, "create_own_activity_v1", ownBody),
      "create_own_activity_v1",
    );
    ownActivityId = assertUuid(ownActivity.activity_id, "ownActivity.id");
  });

  await check("Admin revoca el permiso y bloquea nuevas creaciones", async () => {
    const permission = firstRpcRow(
      await rpc(
        local,
        tokens.admin,
        "set_operator_creation_permission_v1",
        { p_operator_id: identities.operator.id, p_enabled: false },
      ),
      "set_operator_creation_permission_v1",
    );
    assert.equal(permission.can_create_own_activities, false);
    await expectSqlState(
      local,
      tokens.operator,
      "create_own_activity_v1",
      { ...ownBody, p_idempotency_key: randomUUID() },
      "SR002",
    );
    const existing = await selectRows(
      local,
      tokens.operator,
      "activities",
      `select=id&id=eq.${ownActivityId}`,
    );
    assert.equal(existing.length, 1);
  });

  let otherActivity;
  await check("dos operarios quedan aislados entre si por RLS", async () => {
    otherActivity = firstRpcRow(
      await rpc(local, tokens.admin, "plan_activity_v1", {
        ...planBody,
        p_idempotency_key: randomUUID(),
        p_responsible_id: identities.other.id,
        p_title: "Actividad para otro operario",
      }),
      "plan_activity_v1",
    );
    const query = `select=id&id=eq.${otherActivity.activity_id}`;
    assert.deepEqual(await selectRows(local, tokens.operator, "activities", query), []);
    assert.equal((await selectRows(local, tokens.other, "activities", query)).length, 1);
  });

  let bursonActivity;
  await check("Burson crea y consulta solo sus propios encargos", async () => {
    const bursonBody = {
      p_idempotency_key: randomUUID(),
      p_type: "Creatividad",
      p_title: "Encargo Burson local",
      p_description: "Canal externo limitado al encargo propio.",
      p_place: "Lima",
      p_spans: spans,
      p_reference_link: "https://example.com/referencia-local",
    };
    bursonActivity = firstRpcRow(
      await rpc(local, tokens.burson, "create_burson_request_v1", bursonBody),
      "create_burson_request_v1",
    );
    const ownQuery = `select=id,responsible_id&id=eq.${bursonActivity.activity_id}`;
    const bursonRows = await selectRows(
      local,
      tokens.burson,
      "activities",
      ownQuery,
    );
    assert.equal(bursonRows.length, 1);
    assert.equal(bursonRows[0].responsible_id, identities.operator.id);
    assert.deepEqual(
      await selectRows(
        local,
        tokens.burson,
        "activities",
        `select=id&id=eq.${planned.activity_id}`,
      ),
      [],
    );
  });

  await check("el encargo Burson solo llega a participantes autorizados", async () => {
    const query = `select=id&id=eq.${bursonActivity.activity_id}`;
    assert.equal((await selectRows(local, tokens.admin, "activities", query)).length, 1);
    assert.equal(
      (await selectRows(local, tokens.operator, "activities", query)).length,
      1,
    );
    assert.deepEqual(await selectRows(local, tokens.other, "activities", query), []);
    assert.deepEqual(
      await selectRows(
        local,
        tokens.burson,
        "audit_events",
        `select=id&activity_id=eq.${bursonActivity.activity_id}`,
      ),
      [],
    );
  });

  await check("Burson no adquiere autoridad administrativa", async () => {
    await expectSqlState(
      local,
      tokens.burson,
      "plan_activity_v1",
      {
        ...planBody,
        p_idempotency_key: randomUUID(),
        p_responsible_id: identities.other.id,
      },
      "SR002",
    );
  });

  await check("solo Admin envia una actividad a Papelera", async () => {
    await expectSqlState(
      local,
      tokens.operator,
      "soft_delete_activity_v1",
      {
        p_activity_id: planned.activity_id,
        p_expected_version: activityVersion,
        p_reason: "Intento no autorizado",
      },
      "SR002",
    );
    await expectSqlState(
      local,
      tokens.admin,
      "soft_delete_activity_v1",
      {
        p_activity_id: planned.activity_id,
        p_expected_version: activityVersion - 1,
        p_reason: "Version obsoleta",
      },
      "SR001",
    );
    const deleted = firstRpcRow(
      await rpc(local, tokens.admin, "soft_delete_activity_v1", {
        p_activity_id: planned.activity_id,
        p_expected_version: activityVersion,
        p_reason: "Prueba reversible local",
      }),
      "soft_delete_activity_v1",
    );
    activityVersion = deleted.activity_version;
    assert.equal(activityVersion, 4);
  });

  await check("RLS oculta Papelera a operarios y la conserva para Admin", async () => {
    const query = `select=id,deleted_at&id=eq.${planned.activity_id}`;
    assert.deepEqual(await selectRows(local, tokens.operator, "activities", query), []);
    const adminRows = await selectRows(local, tokens.admin, "activities", query);
    assert.equal(adminRows.length, 1);
    assert.equal(typeof adminRows[0].deleted_at, "string");
    await expectSqlState(
      local,
      tokens.admin,
      "soft_delete_activity_v1",
      {
        p_activity_id: planned.activity_id,
        p_expected_version: activityVersion,
        p_reason: "Segundo intento local",
      },
      "SR010",
    );
  });

  await check("solo Admin restaura desde Papelera con version vigente", async () => {
    await expectSqlState(
      local,
      tokens.other,
      "restore_activity_v1",
      {
        p_activity_id: planned.activity_id,
        p_expected_version: activityVersion,
        p_responsible_id: identities.operator.id,
      },
      "SR002",
    );
    await expectSqlState(
      local,
      tokens.admin,
      "restore_activity_v1",
      {
        p_activity_id: planned.activity_id,
        p_expected_version: activityVersion - 1,
        p_responsible_id: identities.operator.id,
      },
      "SR001",
    );
    const restored = firstRpcRow(
      await rpc(local, tokens.admin, "restore_activity_v1", {
        p_activity_id: planned.activity_id,
        p_expected_version: activityVersion,
        p_responsible_id: identities.operator.id,
      }),
      "restore_activity_v1",
    );
    activityVersion = restored.activity_version;
    assert.equal(activityVersion, 5);
    const visibleAgain = await selectRows(
      local,
      tokens.operator,
      "activities",
      `select=id&id=eq.${planned.activity_id}`,
    );
    assert.equal(visibleAgain.length, 1);
  });
}

try {
  console.log("Verificando Supabase local (ninguna llamada remota esta permitida)...");
  const dockerCommand = findDocker();
  const dockerEnvironment = environmentWithDocker(dockerCommand);
  const projectId = readProjectId();

  runSupabase(
    ["start", "--exclude", excludedServices, "--yes"],
    dockerEnvironment,
    "iniciar Auth, PostgREST y PostgreSQL locales",
  );
  let local = readLocalStatus(dockerEnvironment);
  console.log("Destino confirmado: 127.0.0.1 (Supabase local)." );

  resetLocalDatabase(dockerEnvironment, "reiniciar la base local al inicio");
  localDatabaseWasReset = true;
  local = readLocalStatus(dockerEnvironment);
  await waitForLocalServices(local);
  const databaseContainer = ensureDatabaseContainer(dockerCommand, projectId);

  await runSmoke(local, dockerCommand, databaseContainer);
} catch (error) {
  primaryFailure = error;
} finally {
  if (localDatabaseWasReset) {
    try {
      const dockerCommand = findDocker();
      const dockerEnvironment = environmentWithDocker(dockerCommand);
      resetLocalDatabase(dockerEnvironment, "limpiar la base local al finalizar");
    } catch (cleanupError) {
      if (!primaryFailure) primaryFailure = cleanupError;
      else console.error("ADVERTENCIA: no se completo la limpieza local final.");
    }
  }
}

if (primaryFailure) {
  console.error(
    `FALLO el smoke local: ${
      primaryFailure instanceof Error ? primaryFailure.message : "error desconocido"
    }`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Smoke local aprobado: ${checksPassed} controles. La base local quedo limpia.`,
  );
}
