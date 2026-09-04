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

function readApiMaxRows() {
  const config = readFileSync(supabaseConfigPath, "utf8");
  const apiSection = config.match(/^\[api\]\s*$([\s\S]*?)(?=^\[)/m)?.[1];
  const match = apiSection?.match(/^max_rows\s*=\s*(\d+)\s*$/m);
  if (!match) fail("supabase/config.toml no declara api.max_rows.");
  const value = Number(match[1]);
  if (!Number.isSafeInteger(value) || value < 1) {
    fail("api.max_rows debe ser un entero positivo.");
  }
  return value;
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

function runPsql(dockerCommand, containerName, sql, options = {}) {
  const result = commandResult(
    dockerCommand,
    [
      "exec",
      "-i",
      containerName,
      "psql",
      "-X",
      "-q",
      ...(options.tuplesOnly ? ["--tuples-only", "--no-align"] : []),
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
    fail(`No se pudo ${options.description ?? "ejecutar SQL local"}.`);
  }
  return result.stdout.trim();
}

function runPsqlJson(dockerCommand, containerName, sql, description) {
  const output = runPsql(dockerCommand, containerName, sql, {
    tuplesOnly: true,
    description,
  });
  try {
    return JSON.parse(output);
  } catch {
    fail(`PostgreSQL no devolvio JSON valido al ${description}.`);
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

function decodeJwtClaims(token) {
  assert.equal(typeof token, "string", "el token local no es texto");
  const segments = token.split(".");
  assert.equal(segments.length, 3, "el token local no tiene formato JWT");
  let claims;
  try {
    claims = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
  } catch {
    fail("el token local no contiene claims JSON validos");
  }
  assert.equal(typeof claims, "object");
  assert.notEqual(claims, null);
  assertUuid(claims.sub, "claims.sub");
  assertUuid(claims.session_id, "claims.session_id");
  return claims;
}

function planExecutionTime(plan, name) {
  assert.equal(Array.isArray(plan), true, `${name} no devolvio un plan JSON`);
  const milliseconds = plan[0]?.["Execution Time"];
  assert.equal(
    typeof milliseconds,
    "number",
    `${name} no informo Execution Time`,
  );
  assert.ok(milliseconds >= 0, `${name} devolvio una duracion negativa`);
  return milliseconds;
}

function assertSameTimestamp(actual, expected, name) {
  assert.equal(typeof actual, "string", `${name} actual no es texto`);
  assert.equal(typeof expected, "string", `${name} esperado no es texto`);
  const actualTimestamp = Date.parse(actual);
  const expectedTimestamp = Date.parse(expected);
  assert.ok(Number.isFinite(actualTimestamp), `${name} actual no es una fecha`);
  assert.ok(
    Number.isFinite(expectedTimestamp),
    `${name} esperado no es una fecha`,
  );
  assert.equal(actualTimestamp, expectedTimestamp, `${name} no coincide`);
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

async function updateAuthUser(local, userId, attributes, description) {
  assertUuid(userId, "auth.user_id");
  const response = await localFetch(local, `/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    key: local.serviceRoleKey,
    token: local.serviceRoleKey,
    body: attributes,
  });
  assert.equal(
    response.ok,
    true,
    `${description} fallo en GoTrue local (HTTP ${response.status})`,
  );
  assert.equal(response.data?.id, userId);
  return response.data;
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
  assert.equal(
    response.ok,
    true,
    `PostgREST rechazo ${table} (HTTP ${response.status}, ${response.data?.code ?? "sin-codigo"})`,
  );
  assert.ok(Array.isArray(response.data));
  return response.data;
}

async function expectSelectDeniedOrEmpty(local, token, table, query) {
  assert.match(table, /^[a-z_]+$/);
  const response = await localFetch(local, `/rest/v1/${table}?${query}`, {
    token,
  });
  if (response.ok) {
    assert.ok(Array.isArray(response.data));
    assert.deepEqual(response.data, []);
    return;
  }
  assert.ok(
    response.status === 401 || response.status === 403,
    `${table} devolvio HTTP ${response.status} en vez de cerrar la lectura`,
  );
}

function chunkArray(values, size) {
  assert.ok(Number.isInteger(size) && size > 0);
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function selectAllByNumericId(
  local,
  token,
  table,
  baseQuery,
  requestedLimit,
  onPage,
) {
  const rows = [];
  const pageSizes = [];
  let cursor = 0;
  for (;;) {
    const page = await selectRows(
      local,
      token,
      table,
      `${baseQuery}&id=gt.${cursor}&order=id.asc&limit=${requestedLimit}`,
    );
    pageSizes.push(page.length);
    if (!page.length) break;
    if (onPage) await onPage(page, pageSizes.length);
    const nextCursor = page.at(-1)?.id;
    assert.equal(typeof nextCursor, "number");
    assert.ok(nextCursor > cursor, `${table} no avanzo su cursor numerico`);
    rows.push(...page);
    cursor = nextCursor;
  }
  return { pageSizes, rows };
}

async function selectAllByStringId(
  local,
  token,
  table,
  baseQuery,
  requestedLimit,
  onPage,
) {
  const rows = [];
  const pageSizes = [];
  let cursor = null;
  for (;;) {
    const cursorFilter = cursor === null ? "" : `&id=gt.${cursor}`;
    const page = await selectRows(
      local,
      token,
      table,
      `${baseQuery}${cursorFilter}&order=id.asc&limit=${requestedLimit}`,
    );
    pageSizes.push(page.length);
    if (!page.length) break;
    if (onPage) await onPage(page, pageSizes.length);
    const nextCursor = page.at(-1)?.id;
    assert.equal(typeof nextCursor, "string");
    assert.ok(
      cursor === null || nextCursor > cursor,
      `${table} no avanzo su cursor textual`,
    );
    rows.push(...page);
    cursor = nextCursor;
  }
  return { pageSizes, rows };
}

function deterministicUuid(prefix, ordinal) {
  assert.match(prefix, /^[0-9a-f]{8}$/i);
  assert.ok(Number.isSafeInteger(ordinal) && ordinal > 0);
  return `${prefix}-0000-4000-8000-${String(ordinal).padStart(12, "0")}`;
}

function collectPlanIndexNames(plan) {
  const names = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (typeof node["Index Name"] === "string") names.push(node["Index Name"]);
    if (Array.isArray(node.Plans)) node.Plans.forEach(visit);
  };
  const root = Array.isArray(plan) ? plan[0]?.Plan : undefined;
  visit(root);
  return names;
}

function collectPlanNodes(plan) {
  const nodes = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    nodes.push(node);
    if (Array.isArray(node.Plans)) node.Plans.forEach(visit);
  };
  const root = Array.isArray(plan) ? plan[0]?.Plan : undefined;
  visit(root);
  return nodes;
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

function assertConcurrentOutcome(responses, functionName, expectedFailureCodes) {
  assert.equal(responses.length, 2, `${functionName} no recibio dos respuestas`);
  const successful = responses.filter((response) => response.ok);
  const failed = responses.filter((response) => !response.ok);
  assert.equal(successful.length, 1, `${functionName} debio tener un solo exito`);
  assert.equal(failed.length, 1, `${functionName} debio tener un solo rechazo`);
  const failureCode = failed[0].data?.code ?? "sin-codigo";
  assert.ok(
    expectedFailureCodes.includes(failureCode),
    `${functionName} devolvio un conflicto inesperado: ${failureCode}`,
  );
  return firstRpcRow(successful[0].data, functionName);
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

  const readProfileAsAdmin = async (profileId) => {
    const rows = await selectRows(
      local,
      tokens.admin,
      "profiles",
      "select=id,username,display_name,role,is_active,is_burson_operator," +
        `can_create_own_activities,must_change_password,updated_at&id=eq.${profileId}`,
    );
    assert.equal(rows.length, 1, `no se encontro el perfil ${profileId}`);
    return rows[0];
  };

  const updateAccountBody = (profile, overrides = {}) => ({
    p_profile_id: profile.id,
    p_expected_updated_at: profile.updated_at,
    p_display_name: profile.display_name,
    p_role: profile.role,
    p_is_active: profile.is_active,
    p_is_burson_operator: profile.is_burson_operator,
    p_can_create_own_activities: profile.can_create_own_activities,
    ...overrides,
  });

  const provisionReadyAccount = async (
    label,
    {
      role = "operario",
      isBursonOperator = false,
      canCreateOwnActivities = false,
    } = {},
  ) => {
    const identity = await createAuthUser(local, label, runTag);
    const created = firstRpcRow(
      await rpc(local, local.serviceRoleKey, "create_account_profile_v1", {
        p_profile_id: identity.id,
        p_username: `${label}-${runTag}`,
        p_display_name: `Cuenta ${label}`,
        p_role: role,
        p_is_burson_operator: isBursonOperator,
        p_can_create_own_activities: canCreateOwnActivities,
        p_actor_id: identities.admin.id,
      }),
      "create_account_profile_v1",
    );
    assert.equal(created.profile_id, identity.id);
    const finalPassword = randomPassword();
    await updateAuthUser(
      local,
      identity.id,
      { password: finalPassword },
      `reemplazar la clave temporal de ${label}`,
    );
    await rpc(
      local,
      local.serviceRoleKey,
      "complete_temporary_password_change_v1",
      { p_profile_id: identity.id },
    );
    identity.password = finalPassword;
    const token = await login(local, identity);
    await rpc(local, token, "register_app_session", {});
    return { identity, token };
  };

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
    const auditQuery =
      `select=id&activity_id=eq.${bursonActivity.activity_id}`;
    const adminAudits = await selectRows(
      local,
      tokens.admin,
      "audit_events",
      auditQuery,
    );
    assert.ok(adminAudits.length > 0);
    assert.deepEqual(
      await selectRows(local, tokens.burson, "audit_events", auditQuery),
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
      tokens.admin,
      "soft_delete_activity_v1",
      {
        p_activity_id: planned.activity_id,
        p_expected_version: activityVersion,
        p_reason: " ",
      },
      "SR003",
    );
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

  const deliverableSpans = [
    { start: "2030-03-02", end: "2030-03-04" },
    { start: "2030-03-10", end: "2030-03-10" },
  ];
  const deliverablePlanBody = {
    p_idempotency_key: randomUUID(),
    p_responsible_id: identities.operator.id,
    p_type: "Creatividad",
    p_title: "Actividad local con conversacion",
    p_description: "Ciclo completo de entrega y conversacion privada.",
    p_place: "Lima",
    p_spans: deliverableSpans,
  };
  let deliverable;
  let deliverableVersion;

  await check("Admin planifica dos jornadas discontinuas exactas", async () => {
    deliverable = firstRpcRow(
      await rpc(local, tokens.admin, "plan_activity_v1", deliverablePlanBody),
      "plan_activity_v1",
    );
    assertUuid(deliverable.activity_id, "deliverable.activity_id");
    deliverableVersion = deliverable.activity_version;
    assert.equal(deliverableVersion, 1);

    const query =
      `select=position,start_date,end_date&activity_id=eq.${deliverable.activity_id}` +
      "&order=position.asc";
    const expectedSpans = [
      { position: 1, start_date: "2030-03-02", end_date: "2030-03-04" },
      { position: 2, start_date: "2030-03-10", end_date: "2030-03-10" },
    ];
    assert.deepEqual(
      await selectRows(local, tokens.admin, "activity_date_spans", query),
      expectedSpans,
    );
    assert.deepEqual(
      await selectRows(local, tokens.operator, "activity_date_spans", query),
      expectedSpans,
    );
    assert.deepEqual(
      await selectRows(local, tokens.other, "activity_date_spans", query),
      [],
    );
    assert.deepEqual(
      await selectRows(local, tokens.burson, "activity_date_spans", query),
      [],
    );
  });

  await check("solo el responsable inicia la actividad planificada", async () => {
    for (const label of ["admin", "other", "burson"]) {
      await expectSqlState(
        local,
        tokens[label],
        "advance_activity_v1",
        {
          p_activity_id: deliverable.activity_id,
          p_expected_version: deliverableVersion,
        },
        "SR002",
      );
    }
    const started = firstRpcRow(
      await rpc(local, tokens.operator, "advance_activity_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
      }),
      "advance_activity_v1",
    );
    deliverableVersion = started.activity_version;
    assert.equal(deliverableVersion, 2);
    assert.equal(started.activity_status, "En proceso");
  });

  await check("la entrega exige material HTTPS sin escritura parcial", async () => {
    await expectSqlState(
      local,
      tokens.operator,
      "advance_activity_v1",
      {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
      },
      "SR005",
    );
    const rows = await selectRows(
      local,
      tokens.operator,
      "activities",
      `select=status,version,material_link,delivered_at&id=eq.${deliverable.activity_id}`,
    );
    assert.deepEqual(rows, [
      {
        status: "En proceso",
        version: 2,
        material_link: "",
        delivered_at: null,
      },
    ]);
    const audits = await selectRows(
      local,
      tokens.admin,
      "audit_events",
      `select=action,detail&activity_id=eq.${deliverable.activity_id}&order=id.asc`,
    );
    assert.deepEqual(
      audits.map((row) => row.action),
      ["Actividad planificada", "Estado cambiado"],
    );
  });

  const deliverableMaterial = `https://example.com/material-${runTag}`;
  const deliverableOpinion = `Opinion operativa ${runTag}`;
  await check("el responsable completa entrega, campos y auditoria", async () => {
    const execution = firstRpcRow(
      await rpc(local, tokens.operator, "update_execution_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
        p_material_link: deliverableMaterial,
        p_operator_opinion: deliverableOpinion,
      }),
      "update_execution_v1",
    );
    deliverableVersion = execution.activity_version;
    assert.equal(deliverableVersion, 3);

    const delivered = firstRpcRow(
      await rpc(local, tokens.operator, "advance_activity_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
      }),
      "advance_activity_v1",
    );
    deliverableVersion = delivered.activity_version;
    assert.equal(deliverableVersion, 4);
    assert.equal(delivered.activity_status, "Entregada");
    await expectSqlState(
      local,
      tokens.operator,
      "advance_activity_v1",
      {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
      },
      "SR004",
    );

    const rows = await selectRows(
      local,
      tokens.operator,
      "activities",
      `select=status,version,material_link,operator_opinion,delivered_at&id=eq.${deliverable.activity_id}`,
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "Entregada");
    assert.equal(rows[0].version, 4);
    assert.equal(rows[0].material_link, deliverableMaterial);
    assert.equal(rows[0].operator_opinion, deliverableOpinion);
    assert.equal(typeof rows[0].delivered_at, "string");

    const auditQuery =
      `select=action,detail&activity_id=eq.${deliverable.activity_id}` +
      "&order=id.asc";
    const adminAudits = await selectRows(
      local,
      tokens.admin,
      "audit_events",
      auditQuery,
    );
    assert.deepEqual(
      adminAudits.map((row) => row.action),
      [
        "Actividad planificada",
        "Estado cambiado",
        "Ejecuci\u00f3n actualizada",
        "Estado cambiado",
      ],
    );
    assert.deepEqual(
      adminAudits
        .filter((row) => row.action === "Estado cambiado")
        .map((row) => row.detail.estado),
      ["En proceso", "Entregada"],
    );
    assert.deepEqual(
      await selectRows(local, tokens.operator, "audit_events", auditQuery),
      adminAudits,
    );
    assert.deepEqual(
      await selectRows(local, tokens.other, "audit_events", auditQuery),
      [],
    );
    assert.deepEqual(
      await selectRows(local, tokens.burson, "audit_events", auditQuery),
      [],
    );
  });

  await check("la conversacion falla cerrada antes de la apertura Admin", async () => {
    await expectSqlState(
      local,
      tokens.operator,
      "post_activity_message_v1",
      {
        p_activity_id: deliverable.activity_id,
        p_expected_activity_version: null,
        p_body: "Respuesta antes de apertura",
      },
      "SR008",
    );
    await expectSqlState(
      local,
      tokens.admin,
      "post_activity_message_v1",
      {
        p_activity_id: deliverable.activity_id,
        p_expected_activity_version: deliverableVersion,
        p_body: "   ",
      },
      "SR003",
    );
    for (const label of ["other", "burson"]) {
      await expectSqlState(
        local,
        tokens[label],
        "post_activity_message_v1",
        {
          p_activity_id: deliverable.activity_id,
          p_expected_activity_version: null,
          p_body: "Actor ajeno a la conversacion",
        },
        "SR002",
      );
    }
  });

  const openingBody = `Apertura privada ${runTag}`;
  let openingMessageId;
  let conversationOpenedAt;
  await check("Admin abre un unico hilo y versiona la actividad", async () => {
    const opening = firstRpcRow(
      await rpc(local, tokens.admin, "post_activity_message_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_activity_version: deliverableVersion,
        p_body: openingBody,
      }),
      "post_activity_message_v1",
    );
    deliverableVersion = opening.activity_version;
    openingMessageId = assertUuid(opening.message_id, "opening.message_id");
    conversationOpenedAt = opening.opened_at;
    assert.equal(deliverableVersion, 5);
    assert.equal(opening.message_version, 1);
    assert.equal(typeof conversationOpenedAt, "string");

    const activities = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=version,status,thread_opened_at&id=eq.${deliverable.activity_id}`,
    );
    assert.equal(activities.length, 1);
    assert.equal(activities[0].version, 5);
    assert.equal(activities[0].status, "Entregada");
    assertSameTimestamp(
      activities[0].thread_opened_at,
      conversationOpenedAt,
      "thread_opened_at persistido",
    );
    const messages = await selectRows(
      local,
      tokens.admin,
      "activity_messages",
      `select=id,opens_thread,version&activity_id=eq.${deliverable.activity_id}`,
    );
    assert.deepEqual(messages, [
      { id: openingMessageId, opens_thread: true, version: 1 },
    ]);
  });

  await check("el hilo no reabre y bloquea campos de ejecucion", async () => {
    await expectSqlState(
      local,
      tokens.admin,
      "post_activity_message_v1",
      {
        p_activity_id: deliverable.activity_id,
        p_expected_activity_version: deliverableVersion,
        p_body: "Segundo intento de apertura",
      },
      "SR001",
    );
    await expectSqlState(
      local,
      tokens.operator,
      "update_execution_v1",
      {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion - 1,
        p_material_link: deliverableMaterial,
        p_operator_opinion: "Intento posterior a la apertura",
      },
      "SR007",
    );
  });

  const responseBody = `Respuesta privada ${runTag}`;
  let responseMessageId;
  await check("participantes conversan y RLS excluye a terceros", async () => {
    const response = firstRpcRow(
      await rpc(local, tokens.operator, "post_activity_message_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_activity_version: null,
        p_body: responseBody,
      }),
      "post_activity_message_v1",
    );
    responseMessageId = assertUuid(response.message_id, "response.message_id");
    assert.equal(response.activity_version, deliverableVersion);
    assert.equal(response.message_version, 1);
    assertSameTimestamp(
      response.opened_at,
      conversationOpenedAt,
      "opened_at de respuesta",
    );

    const query =
      `select=id,author_id,body,opens_thread,version&activity_id=eq.${deliverable.activity_id}` +
      "&order=created_at.asc,id.asc";
    const expectedIds = [openingMessageId, responseMessageId].sort();
    for (const label of ["admin", "operator"]) {
      const rows = await selectRows(
        local,
        tokens[label],
        "activity_messages",
        query,
      );
      assert.equal(rows.length, 2);
      assert.deepEqual(
        rows.map((row) => row.id).sort(),
        expectedIds,
      );
    }
    assert.deepEqual(
      await selectRows(local, tokens.other, "activity_messages", query),
      [],
    );
    assert.deepEqual(
      await selectRows(local, tokens.burson, "activity_messages", query),
      [],
    );
  });

  const editedResponseBody = `Respuesta corregida ${runTag}`;
  await check("solo el autor edita con version de mensaje vigente", async () => {
    const edited = firstRpcRow(
      await rpc(local, tokens.operator, "edit_activity_message_v1", {
        p_message_id: responseMessageId,
        p_expected_message_version: 1,
        p_body: editedResponseBody,
      }),
      "edit_activity_message_v1",
    );
    assert.equal(edited.activity_version, deliverableVersion);
    assert.equal(edited.message_version, 2);
    await expectSqlState(
      local,
      tokens.admin,
      "edit_activity_message_v1",
      {
        p_message_id: responseMessageId,
        p_expected_message_version: 2,
        p_body: "Admin no es autor",
      },
      "SR002",
    );
    await expectSqlState(
      local,
      tokens.operator,
      "edit_activity_message_v1",
      {
        p_message_id: responseMessageId,
        p_expected_message_version: 1,
        p_body: "Version obsoleta",
      },
      "SR001",
    );
    const rows = await selectRows(
      local,
      tokens.operator,
      "activity_messages",
      `select=body,version,edited_at&activity_id=eq.${deliverable.activity_id}&id=eq.${responseMessageId}`,
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].body, editedResponseBody);
    assert.equal(rows[0].version, 2);
    assert.equal(typeof rows[0].edited_at, "string");
  });

  await check("Admin no puede dar de baja un mensaje ajeno", async () => {
    await expectSqlState(
      local,
      tokens.admin,
      "delete_activity_message_v1",
      {
        p_message_id: responseMessageId,
        p_expected_message_version: 2,
      },
      "SR002",
    );
  });

  await check("la baja del mensaje rechaza una version obsoleta", async () => {
    await expectSqlState(
      local,
      tokens.operator,
      "delete_activity_message_v1",
      {
        p_message_id: responseMessageId,
        p_expected_message_version: 1,
      },
      "SR001",
    );
  });

  await check("la baja del mensaje no filtra cuerpo ni versiona actividad", async () => {
    const deleted = firstRpcRow(
      await rpc(local, tokens.operator, "delete_activity_message_v1", {
        p_message_id: responseMessageId,
        p_expected_message_version: 2,
      }),
      "delete_activity_message_v1",
    );
    assert.equal(deleted.activity_version, deliverableVersion);
    assert.equal(deleted.message_version, 3);

    const messageQuery =
      `select=id,body,opens_thread,version&activity_id=eq.${deliverable.activity_id}` +
      "&order=created_at.asc,id.asc";
    for (const label of ["admin", "operator"]) {
      const rows = await selectRows(
        local,
        tokens[label],
        "activity_messages",
        messageQuery,
      );
      assert.equal(rows.length, 1);
      assert.equal(rows[0].id, openingMessageId);
      assert.equal(rows[0].opens_thread, true);
    }
    assert.deepEqual(
      await selectRows(local, tokens.other, "activity_messages", messageQuery),
      [],
    );
    assert.deepEqual(
      await selectRows(local, tokens.burson, "activity_messages", messageQuery),
      [],
    );

    const activities = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=version,thread_opened_at&id=eq.${deliverable.activity_id}`,
    );
    assert.equal(activities[0].version, deliverableVersion);
    assertSameTimestamp(
      activities[0].thread_opened_at,
      conversationOpenedAt,
      "thread_opened_at tras baja de mensaje",
    );

    const auditQuery =
      `select=action,detail&activity_id=eq.${deliverable.activity_id}` +
      "&order=id.asc";
    const audits = await selectRows(
      local,
      tokens.admin,
      "audit_events",
      auditQuery,
    );
    assert.deepEqual(
      audits.map((row) => row.action),
      [
        "Actividad planificada",
        "Estado cambiado",
        "Ejecuci\u00f3n actualizada",
        "Estado cambiado",
        "Admin inici\u00f3 la conversaci\u00f3n",
        "Mensaje agregado",
        "Mensaje editado",
        "Mensaje eliminado l\u00f3gicamente",
      ],
    );
    const serializedDetails = JSON.stringify(
      audits.map((row) => row.detail),
    );
    for (const body of [openingBody, responseBody, editedResponseBody]) {
      assert.equal(serializedDetails.includes(body), false);
    }
  });

  let concurrentAdminToken;
  let contestedActivity;
  let contestedVersion;
  await check("otra actividad entregada usa una segunda sesion Admin", async () => {
    concurrentAdminToken = await login(local, identities.admin);
    assert.notEqual(concurrentAdminToken, tokens.admin);
    await rpc(local, concurrentAdminToken, "register_app_session", {});

    contestedActivity = firstRpcRow(
      await rpc(local, tokens.admin, "plan_activity_v1", {
        ...deliverablePlanBody,
        p_idempotency_key: randomUUID(),
        p_title: "Actividad local para carreras",
        p_spans: [{ start: "2030-04-01", end: "2030-04-01" }],
      }),
      "plan_activity_v1",
    );
    contestedVersion = contestedActivity.activity_version;
    const started = firstRpcRow(
      await rpc(local, tokens.operator, "advance_activity_v1", {
        p_activity_id: contestedActivity.activity_id,
        p_expected_version: contestedVersion,
      }),
      "advance_activity_v1",
    );
    contestedVersion = started.activity_version;
    const execution = firstRpcRow(
      await rpc(local, tokens.operator, "update_execution_v1", {
        p_activity_id: contestedActivity.activity_id,
        p_expected_version: contestedVersion,
        p_material_link: `https://example.com/carrera-${runTag}`,
        p_operator_opinion: "Actividad preparada para concurrencia.",
      }),
      "update_execution_v1",
    );
    contestedVersion = execution.activity_version;
    const delivered = firstRpcRow(
      await rpc(local, tokens.operator, "advance_activity_v1", {
        p_activity_id: contestedActivity.activity_id,
        p_expected_version: contestedVersion,
      }),
      "advance_activity_v1",
    );
    contestedVersion = delivered.activity_version;
    assert.equal(contestedVersion, 4);
    assert.equal(delivered.activity_status, "Entregada");
  });

  await check("dos sesiones Admin serializan la apertura del hilo", async () => {
    const responses = await Promise.all([
      rpcResponse(local, tokens.admin, "post_activity_message_v1", {
        p_activity_id: contestedActivity.activity_id,
        p_expected_activity_version: contestedVersion,
        p_body: `Apertura concurrente A ${runTag}`,
      }),
      rpcResponse(local, concurrentAdminToken, "post_activity_message_v1", {
        p_activity_id: contestedActivity.activity_id,
        p_expected_activity_version: contestedVersion,
        p_body: `Apertura concurrente B ${runTag}`,
      }),
    ]);
    const winner = assertConcurrentOutcome(
      responses,
      "post_activity_message_v1",
      ["SR001"],
    );
    contestedVersion = winner.activity_version;
    assert.equal(contestedVersion, 5);
    assert.equal(winner.message_version, 1);

    const activities = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=version,thread_opened_at&id=eq.${contestedActivity.activity_id}`,
    );
    assert.equal(activities.length, 1);
    assert.equal(activities[0].version, 5);
    assertSameTimestamp(
      activities[0].thread_opened_at,
      winner.opened_at,
      "thread_opened_at concurrente",
    );
    const messages = await selectRows(
      local,
      tokens.admin,
      "activity_messages",
      `select=id,opens_thread&activity_id=eq.${contestedActivity.activity_id}`,
    );
    assert.equal(messages.length, 1);
    assert.equal(messages[0].opens_thread, true);
    const audits = await selectRows(
      local,
      tokens.admin,
      "audit_events",
      `select=action&activity_id=eq.${contestedActivity.activity_id}&order=id.asc`,
    );
    assert.equal(
      audits.filter(
        (row) => row.action === "Admin inici\u00f3 la conversaci\u00f3n",
      ).length,
      1,
    );
  });

  await check("dos sesiones Admin serializan una unica baja", async () => {
    const reasons = [
      `Baja concurrente A ${runTag}`,
      `Baja concurrente B ${runTag}`,
    ];
    const responses = await Promise.all([
      rpcResponse(local, tokens.admin, "soft_delete_activity_v1", {
        p_activity_id: contestedActivity.activity_id,
        p_expected_version: contestedVersion,
        p_reason: reasons[0],
      }),
      rpcResponse(local, concurrentAdminToken, "soft_delete_activity_v1", {
        p_activity_id: contestedActivity.activity_id,
        p_expected_version: contestedVersion,
        p_reason: reasons[1],
      }),
    ]);
    const winner = assertConcurrentOutcome(
      responses,
      "soft_delete_activity_v1",
      ["SR001", "SR010"],
    );
    contestedVersion = winner.activity_version;
    assert.equal(contestedVersion, 6);
    assert.equal(typeof winner.deleted_at, "string");

    const activities = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=version,deleted_at,deletion_reason&id=eq.${contestedActivity.activity_id}`,
    );
    assert.equal(activities.length, 1);
    assert.equal(activities[0].version, 6);
    assert.equal(typeof activities[0].deleted_at, "string");
    assert.ok(reasons.includes(activities[0].deletion_reason));
    assert.deepEqual(
      await selectRows(
        local,
        tokens.operator,
        "activities",
        `select=id&id=eq.${contestedActivity.activity_id}`,
      ),
      [],
    );

    const adminMessages = await selectRows(
      local,
      tokens.admin,
      "activity_messages",
      `select=id,opens_thread&activity_id=eq.${contestedActivity.activity_id}`,
    );
    assert.equal(adminMessages.length, 1);
    assert.equal(adminMessages[0].opens_thread, true);
    assert.deepEqual(
      await selectRows(
        local,
        tokens.operator,
        "activity_messages",
        `select=id&activity_id=eq.${contestedActivity.activity_id}`,
      ),
      [],
    );

    const audits = await selectRows(
      local,
      tokens.admin,
      "audit_events",
      `select=action,detail&activity_id=eq.${contestedActivity.activity_id}&order=id.asc`,
    );
    const deletions = audits.filter(
      (row) => row.action === "Actividad dada de baja",
    );
    assert.equal(deletions.length, 1);
    assert.equal(deletions[0].detail.motivo, activities[0].deletion_reason);
  });

  await check("el reset crea artefactos y grants efectivos", async () => {
    const catalog = runPsqlJson(
      dockerCommand,
      databaseContainer,
      `select pg_catalog.json_build_object(
  'partial_index', exists (
    select 1 from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'activities'
      and indexname = 'activities_trashed_idx'
      and indexdef ilike '%where (deleted_at is not null)%'
  ),
  'soft_delete_rpc', pg_catalog.to_regprocedure(
    'public.soft_delete_activity_v1(uuid,integer,text)'
  ) is not null,
  'restore_rpc', pg_catalog.to_regprocedure(
    'public.restore_activity_v1(uuid,integer,uuid)'
  ) is not null,
  'authenticated_soft_delete', pg_catalog.has_function_privilege(
    'authenticated',
    'public.soft_delete_activity_v1(uuid,integer,text)',
    'execute'
  ),
  'anon_soft_delete', pg_catalog.has_function_privilege(
    'anon',
    'public.soft_delete_activity_v1(uuid,integer,text)',
    'execute'
  ),
  'transient_visibility_helpers_absent',
    not exists (
      select 1
      from pg_catalog.pg_proc candidate
      join pg_catalog.pg_namespace namespace
        on namespace.oid = candidate.pronamespace
      where namespace.nspname = 'private'
        and pg_catalog.lower(candidate.proname) in (
          'activity_visible_pred', 'activity_visible_by_id'
        )
    ),
  'optimized_span_policy', (
    select count(*) = 1
      and bool_and(
        pg_catalog.pg_get_expr(candidate.polqual, candidate.polrelid)
          ilike '%activities%'
        and pg_catalog.pg_get_expr(candidate.polqual, candidate.polrelid)
          not ilike '%activity_visible_by_id%'
      )
    from pg_catalog.pg_policy candidate
    where candidate.polrelid = 'public.activity_date_spans'::regclass
  ),
  'optimized_activity_policy', (
    select count(*) = 1
      and bool_and(
        pg_catalog.pg_get_expr(candidate.polqual, candidate.polrelid)
          ilike '%current_app_role%'
        and pg_catalog.pg_get_expr(candidate.polqual, candidate.polrelid)
          ilike '%responsible_id%'
        and pg_catalog.pg_get_expr(candidate.polqual, candidate.polrelid)
          not ilike '%can_view_activity(%'
      )
    from pg_catalog.pg_policy candidate
    where candidate.polrelid = 'public.activities'::regclass
  ),
  'legacy_helpers_preserved',
    pg_catalog.to_regprocedure(
      'private.can_view_activity(activity_origin,uuid,uuid,timestamp with time zone)'
    ) is not null
    and pg_catalog.to_regprocedure(
      'private.can_view_activity_id(uuid)'
    ) is not null,
  'direct_dml_grants', (
    select count(*) from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in (
        'activities', 'activity_date_spans', 'audit_events', 'activity_messages'
      )
      and grantee in ('anon', 'authenticated')
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  )
);`,
      "leer el catalogo posterior al reset",
    );
    assert.deepEqual(catalog, {
      partial_index: true,
      soft_delete_rpc: true,
      restore_rpc: true,
      authenticated_soft_delete: true,
      anon_soft_delete: false,
      transient_visibility_helpers_absent: true,
      optimized_span_policy: true,
      optimized_activity_policy: true,
      legacy_helpers_preserved: true,
      direct_dml_grants: 0,
    });

    const operatorClaims = decodeJwtClaims(tokens.operator);
    runPsql(
      dockerCommand,
      databaseContainer,
      `begin;
set local role authenticated;
set local "request.jwt.claims" = ${sqlLiteral(JSON.stringify(operatorClaims))};
do $probe$
declare
  blocked boolean := false;
begin
  begin
    execute $attack$
      select private.activity_visible_by_id(
        ${sqlLiteral(otherActivity.activity_id)}::uuid,
        true,
        'admin'::public.app_role,
        ${sqlLiteral(identities.operator.id)}::uuid
      )
    $attack$;
  exception
    when undefined_function or insufficient_privilege then
      blocked := true;
  end;
  if not blocked then
    raise exception using
      errcode = 'P0001',
      message = 'el lookup falsificable sigue invocable';
  end if;
end;
$probe$;
rollback;`,
      { description: "rechazar el lookup RLS con rol falsificado" },
    );
  });

  let temporaryAccount;
  await check("cuentas temporales, rotacion y roster fallan cerrados", async () => {
    const adminBefore = await readProfileAsAdmin(identities.admin.id);
    const adminAuditBefore = await selectRows(
      local,
      tokens.admin,
      "account_audit_events",
      `select=id&target_profile_id=eq.${identities.admin.id}`,
    );
    await expectSqlState(
      local,
      tokens.admin,
      "update_account_v1",
      updateAccountBody(adminBefore, { p_is_active: false }),
      "SR009",
    );
    assert.deepEqual(await readProfileAsAdmin(identities.admin.id), adminBefore);
    assert.equal(
      (
        await selectRows(
          local,
          tokens.admin,
          "account_audit_events",
          `select=id&target_profile_id=eq.${identities.admin.id}`,
        )
      ).length,
      adminAuditBefore.length,
    );

    const bursonBefore = await readProfileAsAdmin(identities.burson.id);
    const bursonAuditBefore = await selectRows(
      local,
      tokens.admin,
      "account_audit_events",
      `select=id&target_profile_id=eq.${identities.burson.id}`,
    );
    await expectSqlState(
      local,
      tokens.admin,
      "update_account_v1",
      updateAccountBody(bursonBefore, { p_is_active: false }),
      "SR009",
    );
    assert.deepEqual(await readProfileAsAdmin(identities.burson.id), bursonBefore);
    assert.equal(
      (
        await selectRows(
          local,
          tokens.admin,
          "account_audit_events",
          `select=id&target_profile_id=eq.${identities.burson.id}`,
        )
      ).length,
      bursonAuditBefore.length,
    );

    const identity = await createAuthUser(local, "temporary", runTag);
    firstRpcRow(
      await rpc(local, local.serviceRoleKey, "create_account_profile_v1", {
        p_profile_id: identity.id,
        p_username: `temporary-${runTag}`,
        p_display_name: "Operario temporal local",
        p_role: "operario",
        p_is_burson_operator: false,
        p_can_create_own_activities: false,
        p_actor_id: identities.admin.id,
      }),
      "create_account_profile_v1",
    );
    const assigned = firstRpcRow(
      await rpc(local, tokens.admin, "plan_activity_v1", {
        ...planBody,
        p_idempotency_key: randomUUID(),
        p_responsible_id: identity.id,
        p_title: "Actividad para cuenta temporal",
        p_spans: [{ start: "2031-01-10", end: "2031-01-10" }],
      }),
      "plan_activity_v1",
    );

    let accountToken = await login(local, identity);
    await rpc(local, accountToken, "register_app_session", {});
    const pendingProfile = await selectRows(
      local,
      accountToken,
      "profiles",
      `select=*&id=eq.${identity.id}`,
    );
    assert.equal(pendingProfile.length, 1);
    assert.equal(pendingProfile[0].must_change_password, true);
    for (const forbidden of ["password", "temporary_password", "credential"]) {
      assert.equal(Object.hasOwn(pendingProfile[0], forbidden), false);
    }
    assert.deepEqual(
      await selectRows(
        local,
        accountToken,
        "activities",
        `select=id&id=eq.${assigned.activity_id}`,
      ),
      [],
    );

    const firstPersonalPassword = randomPassword();
    await updateAuthUser(
      local,
      identity.id,
      { password: firstPersonalPassword },
      "cambiar la primera clave temporal",
    );
    await rpc(
      local,
      local.serviceRoleKey,
      "complete_temporary_password_change_v1",
      { p_profile_id: identity.id },
    );
    assert.deepEqual(
      await selectRows(
        local,
        accountToken,
        "profiles",
        `select=id&id=eq.${identity.id}`,
      ),
      [],
    );
    identity.password = firstPersonalPassword;
    accountToken = await login(local, identity);
    await rpc(local, accountToken, "register_app_session", {});
    assert.equal(
      (
        await selectRows(
          local,
          accountToken,
          "activities",
          `select=id&id=eq.${assigned.activity_id}`,
        )
      ).length,
      1,
    );

    await rpc(
      local,
      local.serviceRoleKey,
      "prepare_temporary_password_reset_v1",
      { p_profile_id: identity.id, p_actor_id: identities.admin.id },
    );
    assert.deepEqual(
      await selectRows(
        local,
        accountToken,
        "activities",
        `select=id&id=eq.${assigned.activity_id}`,
      ),
      [],
    );
    const regeneratedPassword = randomPassword();
    await updateAuthUser(
      local,
      identity.id,
      { password: regeneratedPassword },
      "regenerar la clave temporal",
    );
    await rpc(
      local,
      local.serviceRoleKey,
      "confirm_temporary_password_reset_v1",
      { p_profile_id: identity.id, p_actor_id: identities.admin.id },
    );
    identity.password = regeneratedPassword;
    accountToken = await login(local, identity);
    await rpc(local, accountToken, "register_app_session", {});
    assert.deepEqual(
      await selectRows(
        local,
        accountToken,
        "activities",
        `select=id&id=eq.${assigned.activity_id}`,
      ),
      [],
    );

    const finalPassword = randomPassword();
    await updateAuthUser(
      local,
      identity.id,
      { password: finalPassword },
      "reemplazar la clave temporal regenerada",
    );
    await rpc(
      local,
      local.serviceRoleKey,
      "complete_temporary_password_change_v1",
      { p_profile_id: identity.id },
    );
    identity.password = finalPassword;
    accountToken = await login(local, identity);
    await rpc(local, accountToken, "register_app_session", {});
    assert.equal(
      (
        await selectRows(
          local,
          accountToken,
          "activities",
          `select=id&id=eq.${assigned.activity_id}`,
        )
      ).length,
      1,
    );
    const accountHistory = await selectRows(
      local,
      tokens.admin,
      "account_audit_events",
      `select=action,detail&target_profile_id=eq.${identity.id}&order=id.asc`,
    );
    assert.deepEqual(
      accountHistory.map((row) => row.action),
      [
        "Cuenta creada con clave temporal",
        "Clave temporal reemplazada por el usuario",
        "Rotaci\u00f3n de clave temporal iniciada; sesiones revocadas",
        "Clave temporal regenerada por Admin",
        "Clave temporal reemplazada por el usuario",
      ],
    );
    const serializedHistory = JSON.stringify(accountHistory);
    for (const secret of [
      identity.password,
      firstPersonalPassword,
      regeneratedPassword,
      finalPassword,
    ]) {
      assert.equal(serializedHistory.includes(secret), false);
    }
    temporaryAccount = { identity, token: accountToken, assigned };
  });

  let transferredSpecial;
  await check("creacion Burson y transferencia serializan sin parciales", async () => {
    let deliveredVersion = bursonActivity.activity_version;
    const started = firstRpcRow(
      await rpc(local, tokens.operator, "advance_activity_v1", {
        p_activity_id: bursonActivity.activity_id,
        p_expected_version: deliveredVersion,
      }),
      "advance_activity_v1",
    );
    deliveredVersion = started.activity_version;
    const execution = firstRpcRow(
      await rpc(local, tokens.operator, "update_execution_v1", {
        p_activity_id: bursonActivity.activity_id,
        p_expected_version: deliveredVersion,
        p_material_link: `https://example.com/burson-entregado-${runTag}`,
        p_operator_opinion: "Encargo Burson entregado antes del traspaso.",
      }),
      "update_execution_v1",
    );
    deliveredVersion = execution.activity_version;
    const delivered = firstRpcRow(
      await rpc(local, tokens.operator, "advance_activity_v1", {
        p_activity_id: bursonActivity.activity_id,
        p_expected_version: deliveredVersion,
      }),
      "advance_activity_v1",
    );
    assert.equal(delivered.activity_status, "Entregada");

    const openKey = randomUUID();
    const openBody = {
      p_idempotency_key: openKey,
      p_type: "Creatividad",
      p_title: "Encargo abierto antes del traspaso",
      p_description: "Debe moverse al nuevo Operario especial.",
      p_place: "Lima",
      p_spans: [{ start: "2032-02-01", end: "2032-02-02" }],
      p_reference_link: `https://example.com/burson-abierto-${runTag}`,
    };
    const openRequest = firstRpcRow(
      await rpc(local, tokens.burson, "create_burson_request_v1", openBody),
      "create_burson_request_v1",
    );

    const nextSpecialIdentity = await createAuthUser(
      local,
      "next-special",
      runTag,
    );
    const raceBody = {
      ...openBody,
      p_idempotency_key: randomUUID(),
      p_title: "Encargo concurrente con traspaso",
      p_reference_link: `https://example.com/burson-carrera-${runTag}`,
    };
    const [accountResponse, requestResponse] = await Promise.all([
      rpcResponse(local, local.serviceRoleKey, "create_account_profile_v1", {
        p_profile_id: nextSpecialIdentity.id,
        p_username: `next-special-${runTag}`,
        p_display_name: "Nuevo Operario Burson",
        p_role: "operario",
        p_is_burson_operator: true,
        p_can_create_own_activities: false,
        p_actor_id: identities.admin.id,
      }),
      rpcResponse(local, tokens.burson, "create_burson_request_v1", raceBody),
    ]);
    assert.equal(accountResponse.ok, true);
    assert.equal(requestResponse.ok, true);
    const raceRequest = firstRpcRow(
      requestResponse.data,
      "create_burson_request_v1",
    );

    const specialRows = await selectRows(
      local,
      tokens.admin,
      "profiles",
      "select=id,is_burson_operator&role=eq.operario&is_active=eq.true" +
        "&is_burson_operator=eq.true",
    );
    assert.deepEqual(specialRows, [
      { id: nextSpecialIdentity.id, is_burson_operator: true },
    ]);
    const responsibilityRows = await selectRows(
      local,
      tokens.admin,
      "activities",
      "select=id,status,responsible_id" +
        `&id=in.(${[
          bursonActivity.activity_id,
          openRequest.activity_id,
          raceRequest.activity_id,
        ].join(",")})`,
    );
    const byId = new Map(responsibilityRows.map((row) => [row.id, row]));
    assert.equal(
      byId.get(bursonActivity.activity_id)?.responsible_id,
      identities.operator.id,
    );
    assert.equal(byId.get(bursonActivity.activity_id)?.status, "Entregada");
    assert.equal(
      byId.get(openRequest.activity_id)?.responsible_id,
      nextSpecialIdentity.id,
    );
    assert.equal(
      byId.get(raceRequest.activity_id)?.responsible_id,
      nextSpecialIdentity.id,
    );

    const replay = firstRpcRow(
      await rpc(local, tokens.burson, "create_burson_request_v1", raceBody),
      "create_burson_request_v1",
    );
    assert.equal(replay.activity_id, raceRequest.activity_id);
    assert.equal(replay.replayed, true);
    const raceSpans = await selectRows(
      local,
      tokens.admin,
      "activity_date_spans",
      `select=id&activity_id=eq.${raceRequest.activity_id}`,
    );
    assert.equal(raceSpans.length, raceBody.p_spans.length);
    const raceAudits = await selectRows(
      local,
      tokens.admin,
      "audit_events",
      `select=action&activity_id=eq.${raceRequest.activity_id}`,
    );
    assert.deepEqual(raceAudits.map((row) => row.action), [
      "Encargo Burson creado y asignado",
    ]);
    transferredSpecial = {
      identity: nextSpecialIdentity,
      openRequest,
      raceRequest,
    };
  });

  await check("Papelera preserva una entrega completa sin recrear filas", async () => {
    const activityProjection =
      "select=id,origin,created_by,created_by_role,responsible_id," +
      "responsible_name,type,title,description,place,status,material_link," +
      "operator_opinion,reference_link,thread_opened_at,delivered_at" +
      `&id=eq.${deliverable.activity_id}`;
    const beforeActivity = await selectRows(
      local,
      tokens.admin,
      "activities",
      activityProjection,
    );
    const beforeSpans = await selectRows(
      local,
      tokens.admin,
      "activity_date_spans",
      `select=position,start_date,end_date&activity_id=eq.${deliverable.activity_id}` +
        "&order=position.asc",
    );
    const messageSnapshotSql = `select coalesce(pg_catalog.json_agg(row_to_json(message) order by message.id), '[]'::json)
from (
  select id, activity_id, author_id, author_name, author_role, body,
    opens_thread, version, created_at, edited_at, deleted_at, deleted_by
  from public.activity_messages
  where activity_id = ${sqlLiteral(deliverable.activity_id)}::uuid
) message;`;
    const beforeMessages = runPsqlJson(
      dockerCommand,
      databaseContainer,
      messageSnapshotSql,
      "leer mensajes antes del ciclo de Papelera",
    );
    const beforeCount = runPsqlJson(
      dockerCommand,
      databaseContainer,
      "select pg_catalog.json_build_object('count', count(*)) from public.activities;",
      "contar actividades antes del ciclo de Papelera",
    ).count;
    const reason = `Ciclo integral ${runTag}`;
    const deletion = firstRpcRow(
      await rpc(local, tokens.admin, "soft_delete_activity_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
        p_reason: reason,
      }),
      "soft_delete_activity_v1",
    );
    deliverableVersion = deletion.activity_version;
    await expectSqlState(
      local,
      tokens.admin,
      "restore_activity_v1",
      {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
        p_responsible_id: identities.other.id,
      },
      "SR009",
    );
    const restoration = firstRpcRow(
      await rpc(local, tokens.admin, "restore_activity_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
        p_responsible_id: identities.operator.id,
      }),
      "restore_activity_v1",
    );
    deliverableVersion = restoration.activity_version;

    assert.deepEqual(
      await selectRows(local, tokens.admin, "activities", activityProjection),
      beforeActivity,
    );
    assert.deepEqual(
      await selectRows(
        local,
        tokens.admin,
        "activity_date_spans",
        `select=position,start_date,end_date&activity_id=eq.${deliverable.activity_id}` +
          "&order=position.asc",
      ),
      beforeSpans,
    );
    assert.deepEqual(
      runPsqlJson(
        dockerCommand,
        databaseContainer,
        messageSnapshotSql,
        "leer mensajes despues del ciclo de Papelera",
      ),
      beforeMessages,
    );
    assert.equal(
      runPsqlJson(
        dockerCommand,
        databaseContainer,
        "select pg_catalog.json_build_object('count', count(*)) from public.activities;",
        "contar actividades despues del ciclo de Papelera",
      ).count,
      beforeCount,
    );
    const deletionAudits = await selectRows(
      local,
      tokens.admin,
      "audit_events",
      `select=detail&activity_id=eq.${deliverable.activity_id}` +
        "&action=eq.Actividad%20dada%20de%20baja",
    );
    assert.equal(deletionAudits.length, 1);
    assert.equal(deletionAudits[0].detail.motivo, reason);
  });

  await check("respuesta y reasignacion concurrentes conservan autoridad", async () => {
    const concurrentBody = `Respuesta durante reasignacion ${runTag}`;
    const responses = await Promise.all([
      rpcResponse(local, tokens.operator, "post_activity_message_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_activity_version: null,
        p_body: concurrentBody,
      }),
      rpcResponse(local, tokens.admin, "replan_activity_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
        p_responsible_id: identities.other.id,
        p_type: "Creatividad",
        p_title: "Actividad reasignada durante conversacion",
        p_description: "La autoridad queda en el responsable vigente.",
        p_place: "Lima Centro",
        p_spans: deliverableSpans,
      }),
    ]);
    assert.equal(responses[1].ok, true, "la reasignacion Admin debio confirmar");
    if (!responses[0].ok) {
      assert.equal(responses[0].data?.code, "SR002");
    }
    for (const response of responses) {
      assert.notEqual(response.data?.code, "40P01");
    }
    deliverableVersion = firstRpcRow(
      responses[1].data,
      "replan_activity_v1",
    ).activity_version;

    const activityRows = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=responsible_id,version&id=eq.${deliverable.activity_id}`,
    );
    assert.deepEqual(activityRows, [
      { responsible_id: identities.other.id, version: deliverableVersion },
    ]);
    assert.deepEqual(
      await selectRows(
        local,
        tokens.operator,
        "activities",
        `select=id&id=eq.${deliverable.activity_id}`,
      ),
      [],
    );
    const threadQuery =
      `select=id,body&activity_id=eq.${deliverable.activity_id}` +
      "&order=created_at.asc,id.asc";
    assert.deepEqual(
      await selectRows(local, tokens.operator, "activity_messages", threadQuery),
      [],
    );
    assert.ok(
      (await selectRows(local, tokens.other, "activity_messages", threadQuery))
        .length >= 1,
    );
    const concurrentRows = await selectRows(
      local,
      tokens.admin,
      "activity_messages",
      `select=id&activity_id=eq.${deliverable.activity_id}` +
        `&body=eq.${encodeURIComponent(concurrentBody)}`,
    );
    assert.equal(concurrentRows.length, responses[0].ok ? 1 : 0);
  });

  await check("restauracion y cambios de cuenta respetan el mismo orden", async () => {
    const clearedOther = firstRpcRow(
      await rpc(local, tokens.admin, "soft_delete_activity_v1", {
        p_activity_id: otherActivity.activity_id,
        p_expected_version: otherActivity.activity_version,
        p_reason: "Preparar carrera de restauracion",
      }),
      "soft_delete_activity_v1",
    );
    assert.equal(clearedOther.activity_version, otherActivity.activity_version + 1);

    const openCandidate = firstRpcRow(
      await rpc(local, tokens.admin, "plan_activity_v1", {
        ...planBody,
        p_idempotency_key: randomUUID(),
        p_responsible_id: identities.other.id,
        p_title: "Actividad abierta para restauracion concurrente",
        p_spans: [{ start: "2033-03-01", end: "2033-03-01" }],
      }),
      "plan_activity_v1",
    );
    let openVersion = openCandidate.activity_version;
    openVersion = firstRpcRow(
      await rpc(local, tokens.admin, "soft_delete_activity_v1", {
        p_activity_id: openCandidate.activity_id,
        p_expected_version: openVersion,
        p_reason: "Carrera contra cuenta",
      }),
      "soft_delete_activity_v1",
    ).activity_version;
    const otherBeforeOpenRace = await readProfileAsAdmin(identities.other.id);
    const openResponses = await Promise.all([
      rpcResponse(local, tokens.admin, "restore_activity_v1", {
        p_activity_id: openCandidate.activity_id,
        p_expected_version: openVersion,
        p_responsible_id: null,
      }),
      rpcResponse(
        local,
        concurrentAdminToken,
        "update_account_v1",
        updateAccountBody(otherBeforeOpenRace, { p_is_active: false }),
      ),
    ]);
    const openSuccesses = openResponses.filter((response) => response.ok);
    const openFailures = openResponses.filter((response) => !response.ok);
    assert.equal(openSuccesses.length, 1);
    assert.equal(openFailures.length, 1);
    assert.equal(openFailures[0].data?.code, "SR009");
    assert.notEqual(openFailures[0].data?.code, "40P01");

    let otherAfterOpenRace = await readProfileAsAdmin(identities.other.id);
    let openRows = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=id,version,deleted_at,responsible_id&id=eq.${openCandidate.activity_id}`,
    );
    assert.equal(openRows.length, 1);
    if (openResponses[0].ok) {
      assert.equal(otherAfterOpenRace.is_active, true);
      assert.equal(openRows[0].deleted_at, null);
      openVersion = openRows[0].version;
      openVersion = firstRpcRow(
        await rpc(local, tokens.admin, "soft_delete_activity_v1", {
          p_activity_id: openCandidate.activity_id,
          p_expected_version: openVersion,
          p_reason: "Cerrar actividad despues de la carrera",
        }),
        "soft_delete_activity_v1",
      ).activity_version;
    } else {
      assert.equal(otherAfterOpenRace.is_active, false);
      assert.notEqual(openRows[0].deleted_at, null);
      const activeSessions = runPsqlJson(
        dockerCommand,
        databaseContainer,
        `select pg_catalog.json_build_object('count', count(*))
from public.app_sessions
where user_id = ${sqlLiteral(identities.other.id)}::uuid
  and revoked_at is null;`,
        "comprobar sesiones tras desactivar al responsable",
      );
      assert.equal(activeSessions.count, 0);
      const reactivated = firstRpcRow(
        await rpc(
          local,
          tokens.admin,
          "update_account_v1",
          updateAccountBody(otherAfterOpenRace, { p_is_active: true }),
        ),
        "update_account_v1",
      );
      assert.equal(reactivated.profile_id, identities.other.id);
      otherAfterOpenRace = await readProfileAsAdmin(identities.other.id);
      assert.equal(otherAfterOpenRace.is_active, true);
    }

    const deliveredDeletion = firstRpcRow(
      await rpc(local, tokens.admin, "soft_delete_activity_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
        p_reason: "Carrera entregada contra cuenta",
      }),
      "soft_delete_activity_v1",
    );
    deliverableVersion = deliveredDeletion.activity_version;
    const otherBeforeDeliveredRace = await readProfileAsAdmin(
      identities.other.id,
    );
    const deliveredResponses = await Promise.all([
      rpcResponse(local, tokens.admin, "restore_activity_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
        p_responsible_id: null,
      }),
      rpcResponse(
        local,
        concurrentAdminToken,
        "update_account_v1",
        updateAccountBody(otherBeforeDeliveredRace, { p_is_active: false }),
      ),
    ]);
    assert.equal(deliveredResponses.every((response) => response.ok), true);
    for (const response of deliveredResponses) {
      assert.notEqual(response.data?.code, "40P01");
    }
    deliverableVersion = firstRpcRow(
      deliveredResponses[0].data,
      "restore_activity_v1",
    ).activity_version;
    const deliveredRows = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=status,version,deleted_at,responsible_id&id=eq.${deliverable.activity_id}`,
    );
    assert.deepEqual(deliveredRows, [
      {
        status: "Entregada",
        version: deliverableVersion,
        deleted_at: null,
        responsible_id: identities.other.id,
      },
    ]);
    let inactiveOther = await readProfileAsAdmin(identities.other.id);
    assert.equal(inactiveOther.is_active, false);
    await rpc(
      local,
      tokens.admin,
      "update_account_v1",
      updateAccountBody(inactiveOther, { p_is_active: true }),
    );
    tokens.other = await login(local, identities.other);
    await rpc(local, tokens.other, "register_app_session", {});
    inactiveOther = await readProfileAsAdmin(identities.other.id);
    assert.equal(inactiveOther.is_active, true);

    const roleCandidate = firstRpcRow(
      await rpc(local, tokens.admin, "plan_activity_v1", {
        ...planBody,
        p_idempotency_key: randomUUID(),
        p_responsible_id: identities.other.id,
        p_title: "Actividad abierta para carrera de rol",
        p_spans: [{ start: "2033-04-01", end: "2033-04-01" }],
      }),
      "plan_activity_v1",
    );
    const roleCandidateVersion = firstRpcRow(
      await rpc(local, tokens.admin, "soft_delete_activity_v1", {
        p_activity_id: roleCandidate.activity_id,
        p_expected_version: roleCandidate.activity_version,
        p_reason: "Carrera abierta contra cambio de rol",
      }),
      "soft_delete_activity_v1",
    ).activity_version;
    const otherBeforeOpenRoleRace = await readProfileAsAdmin(
      identities.other.id,
    );
    const openRoleResponses = await Promise.all([
      rpcResponse(local, tokens.admin, "restore_activity_v1", {
        p_activity_id: roleCandidate.activity_id,
        p_expected_version: roleCandidateVersion,
        p_responsible_id: null,
      }),
      rpcResponse(
        local,
        concurrentAdminToken,
        "update_account_v1",
        updateAccountBody(otherBeforeOpenRoleRace, { p_role: "admin" }),
      ),
    ]);
    assert.equal(openRoleResponses.filter((response) => response.ok).length, 1);
    assert.equal(
      openRoleResponses.find((response) => !response.ok)?.data?.code,
      "SR009",
    );
    let otherAfterOpenRoleRace = await readProfileAsAdmin(identities.other.id);
    let roleCandidateRows = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=version,deleted_at&id=eq.${roleCandidate.activity_id}`,
    );
    if (openRoleResponses[0].ok) {
      assert.equal(otherAfterOpenRoleRace.role, "operario");
      assert.equal(roleCandidateRows[0].deleted_at, null);
      firstRpcRow(
        await rpc(local, tokens.admin, "soft_delete_activity_v1", {
          p_activity_id: roleCandidate.activity_id,
          p_expected_version: roleCandidateRows[0].version,
          p_reason: "Cerrar carrera abierta de rol",
        }),
        "soft_delete_activity_v1",
      );
    } else {
      assert.equal(otherAfterOpenRoleRace.role, "admin");
      assert.notEqual(roleCandidateRows[0].deleted_at, null);
      await rpc(
        local,
        tokens.admin,
        "update_account_v1",
        updateAccountBody(otherAfterOpenRoleRace, { p_role: "operario" }),
      );
      otherAfterOpenRoleRace = await readProfileAsAdmin(identities.other.id);
    }
    assert.equal(otherAfterOpenRoleRace.role, "operario");

    deliverableVersion = firstRpcRow(
      await rpc(local, tokens.admin, "soft_delete_activity_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
        p_reason: "Carrera entregada contra cambio de rol",
      }),
      "soft_delete_activity_v1",
    ).activity_version;
    const otherBeforeDeliveredRoleRace = await readProfileAsAdmin(
      identities.other.id,
    );
    const deliveredRoleResponses = await Promise.all([
      rpcResponse(local, tokens.admin, "restore_activity_v1", {
        p_activity_id: deliverable.activity_id,
        p_expected_version: deliverableVersion,
        p_responsible_id: null,
      }),
      rpcResponse(
        local,
        concurrentAdminToken,
        "update_account_v1",
        updateAccountBody(otherBeforeDeliveredRoleRace, { p_role: "admin" }),
      ),
    ]);
    assert.equal(deliveredRoleResponses.every((response) => response.ok), true);
    deliverableVersion = firstRpcRow(
      deliveredRoleResponses[0].data,
      "restore_activity_v1",
    ).activity_version;
    const deliveredAfterRoleRace = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=status,deleted_at,responsible_id&id=eq.${deliverable.activity_id}`,
    );
    assert.deepEqual(deliveredAfterRoleRace, [
      {
        status: "Entregada",
        deleted_at: null,
        responsible_id: identities.other.id,
      },
    ]);
    const otherAsAdmin = await readProfileAsAdmin(identities.other.id);
    assert.equal(otherAsAdmin.role, "admin");
    await rpc(
      local,
      tokens.admin,
      "update_account_v1",
      updateAccountBody(otherAsAdmin, { p_role: "operario" }),
    );
    tokens.other = await login(local, identities.other);
    await rpc(local, tokens.other, "register_app_session", {});
  });

  await check("actividad y administracion de cuentas serializan sus carreras", async () => {
    const planTarget = await provisionReadyAccount("race-plan");
    const planTargetProfile = await readProfileAsAdmin(planTarget.identity.id);
    const concurrentPlanBody = {
      ...planBody,
      p_idempotency_key: randomUUID(),
      p_responsible_id: planTarget.identity.id,
      p_title: "Planificacion contra desactivacion",
      p_spans: [{ start: "2034-01-01", end: "2034-01-01" }],
    };
    const planResponses = await Promise.all([
      rpcResponse(local, tokens.admin, "plan_activity_v1", concurrentPlanBody),
      rpcResponse(
        local,
        concurrentAdminToken,
        "update_account_v1",
        updateAccountBody(planTargetProfile, { p_is_active: false }),
      ),
    ]);
    for (const response of planResponses) {
      assert.notEqual(response.data?.code, "40P01");
    }
    if (planResponses[0].ok) {
      assert.equal(planResponses[1].ok, false);
      assert.equal(planResponses[1].data?.code, "SR009");
    } else {
      assert.equal(planResponses[0].data?.code, "SR003");
      assert.equal(planResponses[1].ok, true);
    }
    const plannedRaceRows = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=id,responsible_id&idempotency_key=eq.${concurrentPlanBody.p_idempotency_key}`,
    );
    assert.equal(plannedRaceRows.length, planResponses[0].ok ? 1 : 0);
    assert.equal(
      (await readProfileAsAdmin(planTarget.identity.id)).is_active,
      planResponses[0].ok,
    );

    const ownTarget = await provisionReadyAccount("race-own", {
      canCreateOwnActivities: true,
    });
    const ownTargetProfile = await readProfileAsAdmin(ownTarget.identity.id);
    const concurrentOwnBody = {
      ...ownBody,
      p_idempotency_key: randomUUID(),
      p_title: "Creacion propia contra retiro de permiso",
      p_spans: [{ start: "2034-02-01", end: "2034-02-01" }],
    };
    const ownResponses = await Promise.all([
      rpcResponse(
        local,
        ownTarget.token,
        "create_own_activity_v1",
        concurrentOwnBody,
      ),
      rpcResponse(
        local,
        concurrentAdminToken,
        "update_account_v1",
        updateAccountBody(ownTargetProfile, {
          p_can_create_own_activities: false,
        }),
      ),
    ]);
    assert.equal(ownResponses[1].ok, true);
    assert.notEqual(ownResponses[0].data?.code, "40P01");
    if (!ownResponses[0].ok) assert.equal(ownResponses[0].data?.code, "SR002");
    const ownRaceRows = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=id,responsible_id&idempotency_key=eq.${concurrentOwnBody.p_idempotency_key}`,
    );
    assert.equal(ownRaceRows.length, ownResponses[0].ok ? 1 : 0);
    const ownAfter = await readProfileAsAdmin(ownTarget.identity.id);
    assert.equal(ownAfter.is_active, true);
    assert.equal(ownAfter.role, "operario");
    assert.equal(ownAfter.can_create_own_activities, false);
    if (ownResponses[0].ok) {
      assert.equal(
        (
          await selectRows(
            local,
            ownTarget.token,
            "activities",
            `select=id&id=eq.${ownRaceRows[0].id}`,
          )
        ).length,
        1,
      );
    }

    const replanTarget = await provisionReadyAccount("race-replan");
    const replanTargetProfile = await readProfileAsAdmin(
      replanTarget.identity.id,
    );
    const replanSource = firstRpcRow(
      await rpc(local, tokens.admin, "plan_activity_v1", {
        ...planBody,
        p_idempotency_key: randomUUID(),
        p_title: "Actividad para reasignacion contra rol",
        p_spans: [{ start: "2034-03-01", end: "2034-03-01" }],
      }),
      "plan_activity_v1",
    );
    const replanResponses = await Promise.all([
      rpcResponse(local, tokens.admin, "replan_activity_v1", {
        p_activity_id: replanSource.activity_id,
        p_expected_version: replanSource.activity_version,
        p_responsible_id: replanTarget.identity.id,
        p_type: "Creatividad",
        p_title: "Actividad reasignada contra cambio de rol",
        p_description: "La fila compartida serializa el resultado.",
        p_place: "Lima",
        p_spans: [{ start: "2034-03-02", end: "2034-03-02" }],
      }),
      rpcResponse(
        local,
        concurrentAdminToken,
        "update_account_v1",
        updateAccountBody(replanTargetProfile, { p_role: "admin" }),
      ),
    ]);
    for (const response of replanResponses) {
      assert.notEqual(response.data?.code, "40P01");
    }
    if (replanResponses[0].ok) {
      assert.equal(replanResponses[1].ok, false);
      assert.equal(replanResponses[1].data?.code, "SR009");
    } else {
      assert.equal(replanResponses[0].data?.code, "SR003");
      assert.equal(replanResponses[1].ok, true);
    }
    const replanRows = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=responsible_id,version&id=eq.${replanSource.activity_id}`,
    );
    assert.equal(replanRows.length, 1);
    assert.equal(
      replanRows[0].responsible_id,
      replanResponses[0].ok
        ? replanTarget.identity.id
        : identities.operator.id,
    );
    const invalidOpenAssignments = runPsqlJson(
      dockerCommand,
      databaseContainer,
      `select pg_catalog.json_build_object('count', count(*))
from public.activities activity
join public.profiles profile on profile.id = activity.responsible_id
where activity.deleted_at is null
  and activity.status <> 'Entregada'
  and (not profile.is_active or profile.role <> 'operario');`,
      "comprobar responsables abiertos tras carreras",
    );
    assert.equal(invalidOpenAssignments.count, 0);
  });

  await check("el bloqueo global serializa actores Admin y RPC de servicio", async () => {
    const peerAdmin = await provisionReadyAccount("peer-admin", {
      role: "admin",
    });
    let primaryBefore = await readProfileAsAdmin(identities.admin.id);
    let peerBefore = await readProfileAsAdmin(peerAdmin.identity.id);
    const reciprocalResponses = await Promise.all([
      rpcResponse(
        local,
        tokens.admin,
        "update_account_v1",
        updateAccountBody(peerBefore, {
          p_display_name: "Admin par actualizado",
        }),
      ),
      rpcResponse(
        local,
        peerAdmin.token,
        "update_account_v1",
        updateAccountBody(primaryBefore, {
          p_display_name: "Admin principal actualizado",
        }),
      ),
    ]);
    assert.equal(reciprocalResponses.every((response) => response.ok), true);
    for (const response of reciprocalResponses) {
      assert.notEqual(response.data?.code, "40P01");
    }

    const restorePeerAdmin = async () => {
      const current = await readProfileAsAdmin(peerAdmin.identity.id);
      if (!current.is_active || current.role !== "admin") {
        await rpc(
          local,
          tokens.admin,
          "update_account_v1",
          updateAccountBody(current, {
            p_role: "admin",
            p_is_active: true,
            p_is_burson_operator: false,
            p_can_create_own_activities: false,
          }),
        );
        peerAdmin.token = await login(local, peerAdmin.identity);
        await rpc(local, peerAdmin.token, "register_app_session", {});
      }
      return readProfileAsAdmin(peerAdmin.identity.id);
    };

    peerBefore = await readProfileAsAdmin(peerAdmin.identity.id);
    const createTarget = await createAuthUser(local, "cross-create", runTag);
    const createAuditBefore = await selectRows(
      local,
      tokens.admin,
      "account_audit_events",
      `select=id&target_profile_id=eq.${createTarget.id}`,
    );
    const createResponses = await Promise.all([
      rpcResponse(local, local.serviceRoleKey, "create_account_profile_v1", {
        p_profile_id: createTarget.id,
        p_username: `cross-create-${runTag}`,
        p_display_name: "Cuenta creada en carrera Admin",
        p_role: "operario",
        p_is_burson_operator: false,
        p_can_create_own_activities: false,
        p_actor_id: peerAdmin.identity.id,
      }),
      rpcResponse(
        local,
        tokens.admin,
        "update_account_v1",
        updateAccountBody(peerBefore, { p_role: "operario" }),
      ),
    ]);
    assert.equal(createResponses[1].ok, true);
    assert.notEqual(createResponses[0].data?.code, "40P01");
    if (!createResponses[0].ok) assert.equal(createResponses[0].data?.code, "SR002");
    const createdProfiles = await selectRows(
      local,
      tokens.admin,
      "profiles",
      `select=id&id=eq.${createTarget.id}`,
    );
    assert.equal(createdProfiles.length, createResponses[0].ok ? 1 : 0);
    const createAuditsAfter = await selectRows(
      local,
      tokens.admin,
      "account_audit_events",
      `select=id&target_profile_id=eq.${createTarget.id}`,
    );
    assert.equal(
      createAuditsAfter.length - createAuditBefore.length,
      createResponses[0].ok ? 1 : 0,
    );
    await restorePeerAdmin();

    const targetId = temporaryAccount.identity.id;
    const targetBeforePrepare = await readProfileAsAdmin(targetId);
    assert.equal(targetBeforePrepare.must_change_password, false);
    const prepareAuditBefore = (
      await selectRows(
        local,
        tokens.admin,
        "account_audit_events",
        `select=id&target_profile_id=eq.${targetId}`,
      )
    ).length;
    peerBefore = await readProfileAsAdmin(peerAdmin.identity.id);
    const prepareResponses = await Promise.all([
      rpcResponse(
        local,
        local.serviceRoleKey,
        "prepare_temporary_password_reset_v1",
        { p_profile_id: targetId, p_actor_id: peerAdmin.identity.id },
      ),
      rpcResponse(
        local,
        tokens.admin,
        "update_account_v1",
        updateAccountBody(peerBefore, { p_is_active: false }),
      ),
    ]);
    assert.equal(prepareResponses[1].ok, true);
    assert.notEqual(prepareResponses[0].data?.code, "40P01");
    if (!prepareResponses[0].ok) {
      assert.equal(prepareResponses[0].data?.code, "SR002");
    }
    const targetAfterPrepareRace = await readProfileAsAdmin(targetId);
    assert.equal(
      targetAfterPrepareRace.must_change_password,
      prepareResponses[0].ok,
    );
    const activeTargetSessions = runPsqlJson(
      dockerCommand,
      databaseContainer,
      `select pg_catalog.json_build_object('count', count(*))
from public.app_sessions
where user_id = ${sqlLiteral(targetId)}::uuid
  and revoked_at is null;`,
      "comprobar sesiones tras carrera de preparacion",
    ).count;
    assert.equal(activeTargetSessions === 0, prepareResponses[0].ok);
    assert.equal(
      (
        await selectRows(
          local,
          tokens.admin,
          "account_audit_events",
          `select=id&target_profile_id=eq.${targetId}`,
        )
      ).length - prepareAuditBefore,
      prepareResponses[0].ok ? 1 : 0,
    );
    await restorePeerAdmin();
    if (!prepareResponses[0].ok) {
      await rpc(
        local,
        local.serviceRoleKey,
        "prepare_temporary_password_reset_v1",
        { p_profile_id: targetId, p_actor_id: identities.admin.id },
      );
    }

    const confirmAuditBefore = (
      await selectRows(
        local,
        tokens.admin,
        "account_audit_events",
        `select=id&target_profile_id=eq.${targetId}`,
      )
    ).length;
    peerBefore = await readProfileAsAdmin(peerAdmin.identity.id);
    const confirmResponses = await Promise.all([
      rpcResponse(
        local,
        local.serviceRoleKey,
        "confirm_temporary_password_reset_v1",
        { p_profile_id: targetId, p_actor_id: peerAdmin.identity.id },
      ),
      rpcResponse(
        local,
        tokens.admin,
        "update_account_v1",
        updateAccountBody(peerBefore, { p_role: "operario" }),
      ),
    ]);
    assert.equal(confirmResponses[1].ok, true);
    assert.notEqual(confirmResponses[0].data?.code, "40P01");
    if (!confirmResponses[0].ok) {
      assert.equal(confirmResponses[0].data?.code, "SR002");
    }
    assert.equal((await readProfileAsAdmin(targetId)).must_change_password, true);
    assert.equal(
      (
        await selectRows(
          local,
          tokens.admin,
          "account_audit_events",
          `select=id&target_profile_id=eq.${targetId}`,
        )
      ).length - confirmAuditBefore,
      confirmResponses[0].ok ? 1 : 0,
    );
    await restorePeerAdmin();

    const postRacePassword = randomPassword();
    await updateAuthUser(
      local,
      targetId,
      { password: postRacePassword },
      "cerrar la rotacion usada en carreras Admin",
    );
    await rpc(
      local,
      local.serviceRoleKey,
      "complete_temporary_password_change_v1",
      { p_profile_id: targetId },
    );
    temporaryAccount.identity.password = postRacePassword;
    temporaryAccount.token = await login(local, temporaryAccount.identity);
    await rpc(local, temporaryAccount.token, "register_app_session", {});
  });

  let historicalBoundary;
  let historicalBoundaryVersion;
  await check("Historico aplica el piso 2026, solapamiento y RLS reales", async () => {
    await expectSqlState(
      local,
      tokens.admin,
      "plan_activity_v1",
      {
        ...planBody,
        p_idempotency_key: randomUUID(),
        p_title: "Actividad anterior al Historico",
        p_spans: [{ start: "2025-12-31", end: "2025-12-31" }],
      },
      "SR003",
    );

    historicalBoundary = firstRpcRow(
      await rpc(local, tokens.admin, "plan_activity_v1", {
        ...planBody,
        p_idempotency_key: randomUUID(),
        p_title: "Actividad limite del Historico",
        p_spans: [
          { start: "2026-01-01", end: "2026-01-01" },
          { start: "2026-12-31", end: "2027-01-02" },
          { start: "2028-02-01", end: "2028-02-01" },
        ],
      }),
      "plan_activity_v1",
    );
    historicalBoundaryVersion = historicalBoundary.activity_version;

    const overlapping2026 = await selectRows(
      local,
      tokens.admin,
      "activity_date_spans",
      `select=id,activity_id,position,start_date,end_date&activity_id=eq.${historicalBoundary.activity_id}` +
        "&start_date=lte.2026-12-31&end_date=gte.2026-01-01&order=id.asc",
    );
    const overlapping2027 = await selectRows(
      local,
      tokens.admin,
      "activity_date_spans",
      `select=id,activity_id,position,start_date,end_date&activity_id=eq.${historicalBoundary.activity_id}` +
        "&start_date=lte.2027-12-31&end_date=gte.2027-01-01&order=id.asc",
    );
    assert.equal(overlapping2026.length, 2);
    assert.equal(overlapping2027.length, 1);
    assert.equal(overlapping2027[0].position, 2);

    const allSpans = await selectRows(
      local,
      tokens.admin,
      "activity_date_spans",
      `select=position,start_date,end_date&activity_id=eq.${historicalBoundary.activity_id}&order=position.asc`,
    );
    assert.deepEqual(
      allSpans.map(({ start_date, end_date }) => ({
        start: start_date,
        end: end_date,
      })),
      [
        { start: "2026-01-01", end: "2026-01-01" },
        { start: "2026-12-31", end: "2027-01-02" },
        { start: "2028-02-01", end: "2028-02-01" },
      ],
    );

    const activityQuery =
      "select=id,type,title,responsible_name,status,origin,description,material_link,operator_opinion" +
      `&id=eq.${historicalBoundary.activity_id}&deleted_at=is.null`;
    assert.equal(
      (await selectRows(local, tokens.admin, "activities", activityQuery)).length,
      1,
    );
    assert.equal(
      (await selectRows(local, tokens.operator, "activities", activityQuery)).length,
      1,
    );
    assert.deepEqual(
      await selectRows(local, tokens.other, "activities", activityQuery),
      [],
    );
    assert.deepEqual(
      await selectRows(local, tokens.burson, "activities", activityQuery),
      [],
    );
    await expectSelectDeniedOrEmpty(
      local,
      undefined,
      "activities",
      activityQuery,
    );
  });

  const apiMaxRows = readApiMaxRows();
  const bulkHistoryCount = apiMaxRows + 5;
  const spansPerBulkActivity = 11;
  const hiddenHistoryId = randomUUID();
  const lateHistoryId = randomUUID();
  let bulkHistoryIds;
  let bulkHistorySpanIds;
  await check("Historico supera api.max_rows con keyset bajo una insercion", async () => {
    assert.equal(apiMaxRows, 1000);
    runPsql(
      dockerCommand,
      databaseContainer,
      `begin;
create temporary table smoke_history_ids (
  id uuid primary key,
  ordinal integer not null
) on commit drop;
insert into smoke_history_ids (id, ordinal)
select pg_catalog.md5(${sqlLiteral(runTag)} || ':history:' || value)::uuid, value
from pg_catalog.generate_series(1, ${bulkHistoryCount}) value;
insert into public.activities (
  id, origin, created_by, created_by_role, responsible_id, responsible_name,
  type, title, description, place, status
)
select
  generated.id,
  'operario',
  ${sqlLiteral(identities.operator.id)}::uuid,
  'operario',
  ${sqlLiteral(identities.operator.id)}::uuid,
  'Operario local',
  'Creatividad',
  'Historico masivo ${runTag} ' || generated.ordinal,
  'Carga local para comprobar paginacion real.',
  'Lima',
  'Programada'
from smoke_history_ids generated;
insert into public.activity_date_spans (
  activity_id, position, start_date, end_date
)
select
  generated.id,
  span_number::smallint,
  date '2042-01-01' + (((generated.ordinal - 1) % 300) + span_number - 1)::integer,
  date '2042-01-01' + (((generated.ordinal - 1) % 300) + span_number - 1)::integer
 from smoke_history_ids generated
 cross join pg_catalog.generate_series(1, ${spansPerBulkActivity}) span_number;
insert into public.activities (
  id, origin, created_by, created_by_role, responsible_id, responsible_name,
  type, title, description, place, status
) values (
  ${sqlLiteral(hiddenHistoryId)}::uuid,
  'operario',
  ${sqlLiteral(identities.other.id)}::uuid,
  'operario',
  ${sqlLiteral(identities.other.id)}::uuid,
  'Otro operario local',
  'Creatividad',
  'Historico masivo ajeno ${runTag}',
  'Control negativo de visibilidad a escala.',
  'Lima',
  'Programada'
);
insert into public.activity_date_spans (
  activity_id, position, start_date, end_date
)
select
  ${sqlLiteral(hiddenHistoryId)}::uuid,
  span_number::smallint,
  date '2042-06-01' + (span_number - 1)::integer,
  date '2042-06-01' + (span_number - 1)::integer
from pg_catalog.generate_series(1, ${spansPerBulkActivity}) span_number;
 commit;`,
      { description: "crear el volumen local del Historico" },
    );

    const operatorClaims = decodeJwtClaims(tokens.operator);
    const otherClaims = decodeJwtClaims(tokens.other);
    const bursonClaims = decodeJwtClaims(tokens.burson);
    const adminClaims = decodeJwtClaims(tokens.admin);
    const visibleCounts = (claims, description) =>
      runPsqlJson(
        dockerCommand,
        databaseContainer,
        `begin;
set local statement_timeout = '8s';
set local role authenticated;
set local "request.jwt.claims" = ${sqlLiteral(JSON.stringify(claims))};
select pg_catalog.json_build_object(
  'activities', count(distinct span.activity_id),
  'spans', count(*)
)
from public.activity_date_spans span
where span.start_date <= date '2042-12-31'
  and span.end_date >= date '2042-01-01';
rollback;`,
        description,
      );
    assert.deepEqual(
      visibleCounts(operatorClaims, "contar el conjunto masivo del Operario"),
      {
        activities: bulkHistoryCount,
        spans: bulkHistoryCount * spansPerBulkActivity,
      },
    );
    assert.deepEqual(
      visibleCounts(otherClaims, "contar el conjunto masivo del otro Operario"),
      { activities: 1, spans: spansPerBulkActivity },
    );
    assert.deepEqual(
      visibleCounts(bursonClaims, "contar el conjunto masivo de Burson"),
      { activities: 0, spans: 0 },
    );
    assert.deepEqual(
      visibleCounts(adminClaims, "contar el conjunto masivo de Admin"),
      {
        activities: bulkHistoryCount + 1,
        spans: (bulkHistoryCount + 1) * spansPerBulkActivity,
      },
    );

    const selectiveActivityIds = runPsqlJson(
      dockerCommand,
      databaseContainer,
      `select pg_catalog.json_build_object(
  'ids', coalesce(pg_catalog.json_agg(candidate.id), '[]'::json)
)
from (
  select activity.id
  from public.activities activity
  where activity.title like ${sqlLiteral(`Historico masivo ${runTag} %`)}
  order by activity.id
  limit 20
) candidate;`,
      "elegir actividades para el plan selectivo",
    ).ids;
    assert.equal(selectiveActivityIds.length, 20);
    const selectiveActivityFilter = selectiveActivityIds
      .map((id) => `${sqlLiteral(id)}::uuid`)
      .join(", ");
    const selectiveExplainSql = `
select id, activity_id, position, start_date, end_date
from public.activity_date_spans
where activity_id in (${selectiveActivityFilter})
order by id asc
limit ${apiMaxRows};`;
    const selectiveOperatorPlan = runPsqlJson(
      dockerCommand,
      databaseContainer,
      `begin;
set local statement_timeout = '8s';
set local role authenticated;
set local "request.jwt.claims" = ${sqlLiteral(JSON.stringify(operatorClaims))};
explain (analyze, buffers, verbose, format json)
${selectiveExplainSql}
rollback;`,
      "medir la consulta selectiva con RLS de Operario",
    );
    const selectiveOperatorMilliseconds = planExecutionTime(
      selectiveOperatorPlan,
      "EXPLAIN selectivo RLS Operario",
    );
    assert.equal(selectiveOperatorPlan[0]?.Plan?.["Actual Rows"], 20 * spansPerBulkActivity);
    assert.ok(
      selectiveOperatorMilliseconds < 2_000,
      `la consulta selectiva RLS de Operario tardo ${selectiveOperatorMilliseconds} ms`,
    );
    const historicalExplainSql = `
select id, activity_id, position, start_date, end_date
from public.activity_date_spans
where start_date <= date '2042-12-31'
  and end_date >= date '2042-01-01'
  and id > 0
order by id asc
limit ${apiMaxRows};`;
    const operatorRlsPlan = runPsqlJson(
      dockerCommand,
      databaseContainer,
      `begin;
set local statement_timeout = '8s';
set local role authenticated;
set local "request.jwt.claims" = ${sqlLiteral(JSON.stringify(operatorClaims))};
explain (analyze, buffers, verbose, format json)
${historicalExplainSql}
rollback;`,
      "medir la consulta masiva con RLS de Operario",
    );
    const adminRlsPlan = runPsqlJson(
      dockerCommand,
      databaseContainer,
      `begin;
set local statement_timeout = '8s';
set local role authenticated;
set local "request.jwt.claims" = ${sqlLiteral(JSON.stringify(adminClaims))};
explain (analyze, buffers, verbose, format json)
${historicalExplainSql}
rollback;`,
      "medir la consulta masiva con RLS de Admin",
    );
    const ownerPlan = runPsqlJson(
      dockerCommand,
      databaseContainer,
      `explain (analyze, buffers, verbose, format json)
${historicalExplainSql}`,
      "medir el suelo de la consulta masiva sin RLS",
    );
    const operatorRlsMilliseconds = planExecutionTime(
      operatorRlsPlan,
      "EXPLAIN RLS Operario",
    );
    const adminRlsMilliseconds = planExecutionTime(
      adminRlsPlan,
      "EXPLAIN RLS Admin",
    );
    const ownerMilliseconds = planExecutionTime(ownerPlan, "EXPLAIN sin RLS");
    const optimizedPolicy = runPsqlJson(
      dockerCommand,
      databaseContainer,
      `select pg_catalog.json_build_object(
  'present', exists (
    select 1
    from pg_catalog.pg_policy candidate
    where candidate.polrelid = 'public.activity_date_spans'::regclass
      and pg_catalog.pg_get_expr(candidate.polqual, candidate.polrelid)
        ilike '%activities%'
  )
);`,
      "detectar la politica optimizada",
    ).present;
    if (optimizedPolicy) {
      const operatorPlanText = JSON.stringify(operatorRlsPlan[0]?.Plan);
      const operatorSubplans = collectPlanNodes(operatorRlsPlan).filter(
        (node) => node["Parent Relationship"] === "SubPlan",
      );
      const adminSubplans = collectPlanNodes(adminRlsPlan).filter(
        (node) => node["Parent Relationship"] === "SubPlan",
      );
      assert.equal(
        operatorRlsPlan[0]?.Plan?.["Actual Rows"],
        apiMaxRows,
        "el EXPLAIN de Operario no recorrio una pagina visible completa",
      );
      assert.match(
        operatorPlanText,
        /hashed SubPlan/i,
        "el conjunto visible de activities no se materializo como hash",
      );
      assert.ok(
        operatorSubplans.some((node) => node["Actual Loops"] === 1),
        "el subplan visible de Operario no se ejecuto exactamente una vez",
      );
      assert.ok(
        adminSubplans.every((node) => node["Actual Loops"] === 0),
        "el fast-path Admin ejecuto innecesariamente el conjunto visible",
      );
      assert.ok(
        operatorRlsMilliseconds < 2_000,
        `la consulta RLS de Operario tardo ${operatorRlsMilliseconds} ms`,
      );
      assert.ok(
        adminRlsMilliseconds < 2_000,
        `la consulta RLS de Admin tardo ${adminRlsMilliseconds} ms`,
      );
    } else {
      const rlsOverheadRatio =
        adminRlsMilliseconds === 0
          ? 0
          : (adminRlsMilliseconds - ownerMilliseconds) / adminRlsMilliseconds;
      assert.ok(
        rlsOverheadRatio > 0.7,
        `RLS explico solo ${(rlsOverheadRatio * 100).toFixed(1)}% del tiempo`,
      );
    }
    console.log(
      `INFO - EXPLAIN Historico: Operario ${operatorRlsMilliseconds.toFixed(3)} ms; ` +
        `selectivo ${selectiveOperatorMilliseconds.toFixed(3)} ms; ` +
        `Admin ${adminRlsMilliseconds.toFixed(3)} ms; ` +
        `sin RLS ${ownerMilliseconds.toFixed(3)} ms`,
    );

    const operatorPage = await selectRows(
      local,
      tokens.operator,
      "activity_date_spans",
      "select=id,activity_id,position,start_date,end_date" +
        "&start_date=lte.2042-12-31&end_date=gte.2042-01-01" +
        `&id=gt.0&order=id.asc&limit=${apiMaxRows}`,
    );
    assert.equal(operatorPage.length, apiMaxRows);

    let insertedLate = false;
    const baseQuery =
      "select=id,activity_id,position,start_date,end_date" +
      "&start_date=lte.2042-12-31&end_date=gte.2042-01-01" +
      `&activity_id=neq.${hiddenHistoryId}`;
    const firstRead = await selectAllByNumericId(
      local,
      tokens.admin,
      "activity_date_spans",
      baseQuery,
      apiMaxRows + 5,
      async (_page, pageNumber) => {
        if (pageNumber !== 1 || insertedLate) return;
        insertedLate = true;
        runPsql(
          dockerCommand,
          databaseContainer,
          `begin;
insert into public.activities (
  id, origin, created_by, created_by_role, responsible_id, responsible_name,
  type, title, description, place, status
) values (
  ${sqlLiteral(lateHistoryId)}::uuid,
  'operario',
  ${sqlLiteral(identities.operator.id)}::uuid,
  'operario',
  ${sqlLiteral(identities.operator.id)}::uuid,
  'Operario local',
  'Creatividad',
  'Historico insertado durante keyset ${runTag}',
  'Insercion concurrente controlada.',
  'Lima',
  'Programada'
);
insert into public.activity_date_spans (
  activity_id, position, start_date, end_date
)
select
  ${sqlLiteral(lateHistoryId)}::uuid,
  span_number::smallint,
  date '2042-11-01' + (span_number - 1)::integer,
  date '2042-11-01' + (span_number - 1)::integer
from pg_catalog.generate_series(1, ${spansPerBulkActivity}) span_number;
commit;`,
          { description: "intercalar una insercion local en el keyset" },
        );
      },
    );
    assert.equal(insertedLate, true);
    assert.equal(firstRead.pageSizes[0], apiMaxRows);
    assert.ok(firstRead.pageSizes.length > 2);
    assert.equal(
      firstRead.rows.length,
      (bulkHistoryCount + 1) * spansPerBulkActivity,
    );
    bulkHistorySpanIds = firstRead.rows.map((row) => row.id);
    assert.equal(new Set(bulkHistorySpanIds).size, bulkHistorySpanIds.length);
    bulkHistoryIds = [...new Set(firstRead.rows.map((row) => row.activity_id))];
    assert.equal(bulkHistoryIds.length, bulkHistoryCount + 1);
    assert.ok(bulkHistoryIds.includes(lateHistoryId));

    const stableRead = await selectAllByNumericId(
      local,
      tokens.admin,
      "activity_date_spans",
      baseQuery,
      apiMaxRows + 5,
    );
    assert.deepEqual(
      stableRead.rows.map((row) => row.id),
      bulkHistorySpanIds,
    );
  });

  await check("Historico materializa lotes completos sin omitir ni duplicar", async () => {
    const activityRows = [];
    const spanRows = [];
    const spanPageSizes = [];
    for (const ids of chunkArray(bulkHistoryIds, 100)) {
      const inFilter = `in.(${ids.join(",")})`;
      const activityBatch = await selectAllByStringId(
        local,
        tokens.admin,
        "activities",
        "select=id,version,type,title,responsible_name,status,origin,description,material_link,operator_opinion" +
          `&id=${inFilter}&deleted_at=is.null`,
        apiMaxRows + 5,
      );
      activityRows.push(...activityBatch.rows);

      const spanBatch = await selectAllByNumericId(
        local,
        tokens.admin,
        "activity_date_spans",
        `select=id,activity_id,position,start_date,end_date&activity_id=${inFilter}`,
        apiMaxRows + 5,
      );
      spanRows.push(...spanBatch.rows);
      spanPageSizes.push(...spanBatch.pageSizes);
    }

    assert.equal(activityRows.length, bulkHistoryCount + 1);
    assert.equal(new Set(activityRows.map((row) => row.id)).size, activityRows.length);
    assert.equal(spanRows.length, bulkHistorySpanIds.length);
    assert.equal(new Set(spanRows.map((row) => row.id)).size, spanRows.length);
    assert.ok(spanPageSizes.includes(apiMaxRows));
    const spanCounts = new Map();
    for (const row of spanRows) {
      spanCounts.set(row.activity_id, (spanCounts.get(row.activity_id) ?? 0) + 1);
    }
    assert.equal(spanCounts.size, bulkHistoryCount + 1);
    assert.ok(
      [...spanCounts.values()].every((count) => count === spansPerBulkActivity),
    );

    const rlsQuery =
      "select=id&start_date=lte.2042-12-31&end_date=gte.2042-01-01" +
      `&activity_id=neq.${hiddenHistoryId}&limit=1`;
    assert.equal(
      (await selectRows(local, tokens.operator, "activity_date_spans", rlsQuery))
        .length,
      1,
    );
    for (const token of [tokens.other, tokens.burson]) {
      assert.deepEqual(
        await selectRows(local, token, "activity_date_spans", rlsQuery),
        [],
      );
    }
    await expectSelectDeniedOrEmpty(
      local,
      undefined,
      "activity_date_spans",
      rlsQuery,
    );
  });

  await check("Historico conserva planes EXPLAIN previos a nuevos indices", async () => {
    runPsql(
      dockerCommand,
      databaseContainer,
      "analyze public.activities; analyze public.activity_date_spans;",
      { description: "actualizar estadisticas locales del Historico" },
    );
    const selectivePlan = runPsqlJson(
      dockerCommand,
      databaseContainer,
      `explain (analyze, buffers, format json)
select id, activity_id, position, start_date, end_date
from public.activity_date_spans
where start_date <= date '2026-12-31'
  and end_date >= date '2026-01-01'
  and id > 0
order by id asc
limit 1000;`,
      "explicar la busqueda anual selectiva",
    );
    const massPlan = runPsqlJson(
      dockerCommand,
      databaseContainer,
      `explain (analyze, buffers, format json)
select id, activity_id, position, start_date, end_date
from public.activity_date_spans
where start_date <= date '2042-12-31'
  and end_date >= date '2042-01-01'
  and id > 0
order by id asc
limit 1000;`,
      "explicar la pagina masiva del Historico",
    );
    const selectiveIndexes = collectPlanIndexNames(selectivePlan);
    const massIndexes = collectPlanIndexNames(massPlan);
    assert.ok(selectiveIndexes.includes("activity_date_spans_lookup_idx"));
    assert.ok(massIndexes.includes("activity_date_spans_pkey"));
    for (const plan of [selectivePlan, massPlan]) {
      assert.equal(Array.isArray(plan), true);
      assert.equal(typeof plan[0]?.["Execution Time"], "number");
      assert.ok(plan[0]["Execution Time"] >= 0);
    }
  });

  await check("Historico descarta una actividad dada de baja entre fases", async () => {
    const candidateRows = await selectRows(
      local,
      tokens.admin,
      "activity_date_spans",
      `select=id,activity_id&activity_id=eq.${historicalBoundary.activity_id}` +
        "&start_date=lte.2026-12-31&end_date=gte.2026-01-01&order=id.asc",
    );
    assert.ok(candidateRows.length > 0);

    const beforeRows = await selectRows(
      local,
      tokens.admin,
      "activities",
      `select=id,version&id=eq.${historicalBoundary.activity_id}&deleted_at=is.null`,
    );
    assert.equal(beforeRows.length, 1);
    assert.equal(beforeRows[0].version, historicalBoundaryVersion);

    const deleted = firstRpcRow(
      await rpc(local, tokens.admin, "soft_delete_activity_v1", {
        p_activity_id: historicalBoundary.activity_id,
        p_expected_version: historicalBoundaryVersion,
        p_reason: "Intercalacion controlada del Historico",
      }),
      "soft_delete_activity_v1",
    );
    historicalBoundaryVersion = deleted.activity_version;
    assert.deepEqual(
      await selectRows(
        local,
        tokens.admin,
        "activities",
        `select=id,version&id=eq.${historicalBoundary.activity_id}&deleted_at=is.null`,
      ),
      [],
    );
    assert.deepEqual(
      await selectRows(
        local,
        tokens.operator,
        "activity_date_spans",
        `select=id&activity_id=eq.${historicalBoundary.activity_id}`,
      ),
      [],
    );
    assert.ok(
      (
        await selectRows(
          local,
          tokens.admin,
          "activity_date_spans",
          `select=id&activity_id=eq.${historicalBoundary.activity_id}`,
        )
      ).length > 0,
    );
    assert.deepEqual(
      await selectRows(
        local,
        tokens.other,
        "activity_date_spans",
        `select=id&activity_id=eq.${historicalBoundary.activity_id}`,
      ),
      [],
    );
    assert.deepEqual(
      await selectRows(
        local,
        tokens.burson,
        "activity_date_spans",
        `select=id&activity_id=eq.${historicalBoundary.activity_id}`,
      ),
      [],
    );

    const restored = firstRpcRow(
      await rpc(local, tokens.admin, "restore_activity_v1", {
        p_activity_id: historicalBoundary.activity_id,
        p_expected_version: historicalBoundaryVersion,
        p_responsible_id: identities.operator.id,
      }),
      "restore_activity_v1",
    );
    historicalBoundaryVersion = restored.activity_version;
    assert.equal(
      (
        await selectRows(
          local,
          tokens.operator,
          "activities",
          `select=id&id=eq.${historicalBoundary.activity_id}`,
        )
      ).length,
      1,
    );
  });

  await check("todos los recursos superan api.max_rows con keyset real", async () => {
    const paginationCount = apiMaxRows + 5;
    const lateOrdinal = paginationCount + 1;
    const profilePrefix = "51000000";
    const activityPrefix = "52000000";
    const messagePrefix = "53000000";
    const bursonPrefix = "54000000";
    const firstProfileId = deterministicUuid(profilePrefix, 1);
    const lateProfileId = deterministicUuid(profilePrefix, lateOrdinal);
    const firstActivityId = deterministicUuid(activityPrefix, 1);
    const lateActivityId = deterministicUuid(activityPrefix, lateOrdinal);
    const firstMessageId = deterministicUuid(messagePrefix, 1);
    const lateMessageId = deterministicUuid(messagePrefix, lateOrdinal);
    const firstBursonId = deterministicUuid(bursonPrefix, 1);
    const lateBursonId = deterministicUuid(bursonPrefix, lateOrdinal);
    const activityPlace = `Paginacion-${runTag}`;
    const bursonPlace = `Burson-paginacion-${runTag}`;
    const activityAuditAction = `Paginacion actividad ${runTag}`;
    const accountAuditAction = `Paginacion cuenta ${runTag}`;

    runPsql(
      dockerCommand,
      databaseContainer,
      `begin;
with generated as (
  select ordinal,
    ('${profilePrefix}-0000-4000-8000-' || pg_catalog.lpad(ordinal::text, 12, '0'))::uuid as id
  from pg_catalog.generate_series(1, ${paginationCount}) ordinal
)
insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
select id, 'authenticated', 'authenticated',
  'page-' || ordinal || '-${runTag}@auth.sistema-r.invalid',
  '{}'::jsonb, '{}'::jsonb, now(), now()
from generated;

with generated as (
  select ordinal,
    ('${profilePrefix}-0000-4000-8000-' || pg_catalog.lpad(ordinal::text, 12, '0'))::uuid as id
  from pg_catalog.generate_series(1, ${paginationCount}) ordinal
)
insert into public.profiles (
  id, username, display_name, role, is_active, is_burson_operator,
  can_create_own_activities, must_change_password
)
select id, 'page${runTag}' || ordinal, 'Perfil paginado ' || ordinal,
  'operario'::public.app_role, true, false, false, false
from generated;

with generated as (
  select ordinal,
    ('${activityPrefix}-0000-4000-8000-' || pg_catalog.lpad(ordinal::text, 12, '0'))::uuid as id
  from pg_catalog.generate_series(1, ${paginationCount}) ordinal
)
insert into public.activities (
  id, origin, created_by, created_by_role, responsible_id, responsible_name,
  type, title, description, place
)
select id, 'operario', ${sqlLiteral(identities.admin.id)}::uuid, 'admin',
  ${sqlLiteral(identities.operator.id)}::uuid, 'Operario local',
  'Creatividad', 'Actividad paginada ' || ordinal,
  'Carga real para comprobar el keyset.', ${sqlLiteral(activityPlace)}
from generated;

insert into public.activity_date_spans (
  activity_id, position, start_date, end_date
)
select id, 1, date '2044-01-01', date '2044-01-01'
from public.activities
where id between ${sqlLiteral(firstActivityId)}::uuid
  and ${sqlLiteral(deterministicUuid(activityPrefix, paginationCount))}::uuid;

insert into public.audit_events (
  activity_id, actor_id, actor_name, actor_role, action
)
select id, ${sqlLiteral(identities.admin.id)}::uuid, 'Admin local', 'admin',
  ${sqlLiteral(activityAuditAction)}
from public.activities
where id between ${sqlLiteral(firstActivityId)}::uuid
  and ${sqlLiteral(deterministicUuid(activityPrefix, paginationCount))}::uuid;

with generated as (
  select ordinal,
    ('${messagePrefix}-0000-4000-8000-' || pg_catalog.lpad(ordinal::text, 12, '0'))::uuid as id
  from pg_catalog.generate_series(1, ${paginationCount}) ordinal
)
insert into public.activity_messages (
  id, activity_id, author_id, author_name, author_role, body
)
select id, ${sqlLiteral(deliverable.activity_id)}::uuid,
  ${sqlLiteral(identities.admin.id)}::uuid, 'Admin local', 'admin',
  'Mensaje paginado ' || ordinal || ' ${runTag}'
from generated;

with generated as (
  select ordinal,
    ('${bursonPrefix}-0000-4000-8000-' || pg_catalog.lpad(ordinal::text, 12, '0'))::uuid as id
  from pg_catalog.generate_series(1, ${paginationCount}) ordinal
)
insert into public.activities (
  id, origin, created_by, created_by_role, responsible_id, responsible_name,
  type, title, description, place, reference_link
)
select id, 'burson', ${sqlLiteral(identities.burson.id)}::uuid, 'burson',
  ${sqlLiteral(transferredSpecial.identity.id)}::uuid, 'Nuevo Operario Burson',
  'Creatividad', 'Encargo Burson paginado ' || ordinal,
  'Carga real de encargos Burson.', ${sqlLiteral(bursonPlace)},
  'https://example.com/burson-paginado/' || ordinal
from generated;

insert into public.activity_date_spans (
  activity_id, position, start_date, end_date
)
select id, 1, date '2045-01-01', date '2045-01-01'
from public.activities
where id between ${sqlLiteral(firstBursonId)}::uuid
  and ${sqlLiteral(deterministicUuid(bursonPrefix, paginationCount))}::uuid;

insert into public.account_audit_events (
  target_profile_id, actor_id, actor_name, action
)
select id, ${sqlLiteral(identities.admin.id)}::uuid, 'Admin local',
  ${sqlLiteral(accountAuditAction)}
from public.profiles
where id between ${sqlLiteral(firstProfileId)}::uuid
  and ${sqlLiteral(deterministicUuid(profilePrefix, paginationCount))}::uuid;
commit;`,
      { description: "cargar todos los recursos para paginacion real" },
    );

    const assertCompleteKeyset = (result, expectedCount, name) => {
      assert.equal(result.pageSizes[0], apiMaxRows, `${name} no lleno la primera pagina`);
      assert.equal(result.pageSizes.at(-1), 0, `${name} no cerro el keyset`);
      assert.equal(result.rows.length, expectedCount, `${name} omitio filas`);
      assert.equal(
        new Set(result.rows.map((row) => row.id)).size,
        expectedCount,
        `${name} duplico filas`,
      );
    };

    let lateProfileInserted = false;
    const profiles = await selectAllByStringId(
      local,
      tokens.admin,
      "profiles",
      `select=id&id=gte.${firstProfileId}&id=lte.${lateProfileId}`,
      apiMaxRows,
      async (_page, pageNumber) => {
        if (pageNumber !== 1 || lateProfileInserted) return;
        lateProfileInserted = true;
        runPsql(
          dockerCommand,
          databaseContainer,
          `begin;
insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  ${sqlLiteral(lateProfileId)}::uuid, 'authenticated', 'authenticated',
  'page-late-${runTag}@auth.sistema-r.invalid', '{}'::jsonb, '{}'::jsonb,
  now(), now()
);
insert into public.profiles (
  id, username, display_name, role, is_active, is_burson_operator,
  can_create_own_activities, must_change_password
) values (
  ${sqlLiteral(lateProfileId)}::uuid, 'page${runTag}${lateOrdinal}',
  'Perfil paginado tardio', 'operario', true, false, false, false
);
commit;`,
          { description: "insertar el perfil tardio del keyset" },
        );
      },
    );
    assertCompleteKeyset(profiles, paginationCount + 1, "profiles");

    let lateActivityInserted = false;
    const activities = await selectAllByStringId(
      local,
      tokens.admin,
      "activities",
      `select=id&id=gte.${firstActivityId}&id=lte.${lateActivityId}`,
      apiMaxRows,
      async (_page, pageNumber) => {
        if (pageNumber !== 1 || lateActivityInserted) return;
        lateActivityInserted = true;
        runPsql(
          dockerCommand,
          databaseContainer,
          `insert into public.activities (
  id, origin, created_by, created_by_role, responsible_id, responsible_name,
  type, title, description, place
) values (
  ${sqlLiteral(lateActivityId)}::uuid, 'operario',
  ${sqlLiteral(identities.admin.id)}::uuid, 'admin',
  ${sqlLiteral(identities.operator.id)}::uuid, 'Operario local',
  'Creatividad', 'Actividad paginada tardia',
  'Insercion concurrente controlada.', ${sqlLiteral(activityPlace)}
);`,
          { description: "insertar la actividad tardia del keyset" },
        );
      },
    );
    assertCompleteKeyset(activities, paginationCount + 1, "activities");

    let lateSpanInserted = false;
    const spans = await selectAllByNumericId(
      local,
      tokens.admin,
      "activity_date_spans",
      "select=id,activity_id&start_date=eq.2044-01-01",
      apiMaxRows,
      async (_page, pageNumber) => {
        if (pageNumber !== 1 || lateSpanInserted) return;
        lateSpanInserted = true;
        runPsql(
          dockerCommand,
          databaseContainer,
          `insert into public.activity_date_spans (
  activity_id, position, start_date, end_date
) values (
  ${sqlLiteral(lateActivityId)}::uuid, 1, date '2044-01-01', date '2044-01-01'
);`,
          { description: "insertar la jornada tardia del keyset" },
        );
      },
    );
    assertCompleteKeyset(spans, paginationCount + 1, "activity_date_spans");

    let lateActivityAuditInserted = false;
    const activityAudits = await selectAllByNumericId(
      local,
      tokens.admin,
      "audit_events",
      `select=id&action=eq.${encodeURIComponent(activityAuditAction)}`,
      apiMaxRows,
      async (_page, pageNumber) => {
        if (pageNumber !== 1 || lateActivityAuditInserted) return;
        lateActivityAuditInserted = true;
        runPsql(
          dockerCommand,
          databaseContainer,
          `insert into public.audit_events (
  activity_id, actor_id, actor_name, actor_role, action
) values (
  ${sqlLiteral(lateActivityId)}::uuid,
  ${sqlLiteral(identities.admin.id)}::uuid, 'Admin local', 'admin',
  ${sqlLiteral(activityAuditAction)}
);`,
          { description: "insertar la auditoria tardia del keyset" },
        );
      },
    );
    assertCompleteKeyset(activityAudits, paginationCount + 1, "audit_events");

    let lateMessageInserted = false;
    const messages = await selectAllByStringId(
      local,
      tokens.admin,
      "activity_messages",
      `select=id&id=gte.${firstMessageId}&id=lte.${lateMessageId}`,
      apiMaxRows,
      async (_page, pageNumber) => {
        if (pageNumber !== 1 || lateMessageInserted) return;
        lateMessageInserted = true;
        runPsql(
          dockerCommand,
          databaseContainer,
          `insert into public.activity_messages (
  id, activity_id, author_id, author_name, author_role, body
) values (
  ${sqlLiteral(lateMessageId)}::uuid,
  ${sqlLiteral(deliverable.activity_id)}::uuid,
  ${sqlLiteral(identities.admin.id)}::uuid, 'Admin local', 'admin',
  'Mensaje paginado tardio ${runTag}'
);`,
          { description: "insertar el mensaje tardio del keyset" },
        );
      },
    );
    assertCompleteKeyset(messages, paginationCount + 1, "activity_messages");

    let lateBursonInserted = false;
    const bursonRequests = await selectAllByStringId(
      local,
      tokens.burson,
      "activities",
      `select=id&id=gte.${firstBursonId}&id=lte.${lateBursonId}`,
      apiMaxRows,
      async (_page, pageNumber) => {
        if (pageNumber !== 1 || lateBursonInserted) return;
        lateBursonInserted = true;
        runPsql(
          dockerCommand,
          databaseContainer,
          `begin;
insert into public.activities (
  id, origin, created_by, created_by_role, responsible_id, responsible_name,
  type, title, description, place, reference_link
) values (
  ${sqlLiteral(lateBursonId)}::uuid, 'burson',
  ${sqlLiteral(identities.burson.id)}::uuid, 'burson',
  ${sqlLiteral(transferredSpecial.identity.id)}::uuid,
  'Nuevo Operario Burson', 'Creatividad', 'Encargo Burson paginado tardio',
  'Insercion concurrente controlada.', ${sqlLiteral(bursonPlace)},
  'https://example.com/burson-paginado/tardio'
);
insert into public.activity_date_spans (
  activity_id, position, start_date, end_date
) values (
  ${sqlLiteral(lateBursonId)}::uuid, 1, date '2045-01-01', date '2045-01-01'
);
commit;`,
          { description: "insertar el encargo Burson tardio del keyset" },
        );
      },
    );
    assertCompleteKeyset(
      bursonRequests,
      paginationCount + 1,
      "encargos Burson",
    );

    let lateAccountAuditInserted = false;
    const accountAudits = await selectAllByNumericId(
      local,
      tokens.admin,
      "account_audit_events",
      `select=id&action=eq.${encodeURIComponent(accountAuditAction)}`,
      apiMaxRows,
      async (_page, pageNumber) => {
        if (pageNumber !== 1 || lateAccountAuditInserted) return;
        lateAccountAuditInserted = true;
        runPsql(
          dockerCommand,
          databaseContainer,
          `insert into public.account_audit_events (
  target_profile_id, actor_id, actor_name, action
) values (
  ${sqlLiteral(lateProfileId)}::uuid,
  ${sqlLiteral(identities.admin.id)}::uuid, 'Admin local',
  ${sqlLiteral(accountAuditAction)}
);`,
          { description: "insertar la auditoria de cuenta tardia del keyset" },
        );
      },
    );
    assertCompleteKeyset(
      accountAudits,
      paginationCount + 1,
      "account_audit_events",
    );
  });

  await check("clave pendiente, sesion revocada y perfil inactivo cierran RLS", async () => {
    const operatorActivityQuery =
      `select=id&id=eq.${historicalBoundary.activity_id}`;
    const operatorSpanQuery =
      `select=id&activity_id=eq.${historicalBoundary.activity_id}`;
    assert.equal(
      (await selectRows(local, tokens.operator, "activities", operatorActivityQuery))
        .length,
      1,
    );
    assert.ok(
      (
        await selectRows(
          local,
          tokens.operator,
          "activity_date_spans",
          operatorSpanQuery,
        )
      ).length > 0,
    );

    runPsql(
      dockerCommand,
      databaseContainer,
      `update public.profiles
set must_change_password = true
where id = ${sqlLiteral(identities.operator.id)}::uuid;`,
      { description: "activar la puerta local de clave temporal" },
    );
    assert.equal(
      (
        await selectRows(
          local,
          tokens.operator,
          "profiles",
          `select=id&id=eq.${identities.operator.id}`,
        )
      ).length,
      1,
    );
    assert.deepEqual(
      await selectRows(local, tokens.operator, "activities", operatorActivityQuery),
      [],
    );
    assert.deepEqual(
      await selectRows(
        local,
        tokens.operator,
        "activity_date_spans",
        operatorSpanQuery,
      ),
      [],
    );

    runPsql(
      dockerCommand,
      databaseContainer,
      `update public.profiles
set must_change_password = false
where id = ${sqlLiteral(identities.operator.id)}::uuid;`,
      { description: "completar la puerta local de clave temporal" },
    );
    assert.equal(
      (await selectRows(local, tokens.operator, "activities", operatorActivityQuery))
        .length,
      1,
    );
    assert.ok(
      (
        await selectRows(
          local,
          tokens.operator,
          "activity_date_spans",
          operatorSpanQuery,
        )
      ).length > 0,
    );

    runPsql(
      dockerCommand,
      databaseContainer,
      `update public.app_sessions
set revoked_at = pg_catalog.clock_timestamp()
where user_id = ${sqlLiteral(identities.operator.id)}::uuid
  and revoked_at is null;`,
      { description: "revocar la sesion local del Operario" },
    );
    assert.deepEqual(
      await selectRows(
        local,
        tokens.operator,
        "profiles",
        `select=id&id=eq.${identities.operator.id}`,
      ),
      [],
    );
    assert.deepEqual(
      await selectRows(local, tokens.operator, "activities", operatorActivityQuery),
      [],
    );
    assert.deepEqual(
      await selectRows(
        local,
        tokens.operator,
        "activity_date_spans",
        operatorSpanQuery,
      ),
      [],
    );

    const bursonOwnQuery = `select=id&id=eq.${bursonActivity.activity_id}`;
    const bursonOwnSpanQuery =
      `select=id&activity_id=eq.${bursonActivity.activity_id}`;
    assert.equal(
      (await selectRows(local, tokens.burson, "activities", bursonOwnQuery)).length,
      1,
    );
    assert.ok(
      (
        await selectRows(
          local,
          tokens.burson,
          "activity_date_spans",
          bursonOwnSpanQuery,
        )
      ).length > 0,
    );
    runPsql(
      dockerCommand,
      databaseContainer,
      `update public.profiles
set is_active = false
where id = ${sqlLiteral(identities.burson.id)}::uuid;`,
      { description: "desactivar el perfil Burson local" },
    );
    assert.deepEqual(
      await selectRows(local, tokens.burson, "activities", bursonOwnQuery),
      [],
    );
    assert.deepEqual(
      await selectRows(
        local,
        tokens.burson,
        "activity_date_spans",
        bursonOwnSpanQuery,
      ),
      [],
    );
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
