const errors = [];

function read(name) {
  return process.env[name]?.trim() ?? "";
}

function requireValue(name) {
  const value = read(name);
  if (!value) errors.push(`Falta ${name}.`);
  return value;
}

const usernameDomainPatternSource =
  "^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$";
const supabasePublishableKeyPatternSource =
  "^sb_publishable_[A-Za-z0-9_-]{8,}$";

function jwtPayloads(value) {
  const candidates =
    value.match(
      /[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}/g,
    ) ?? [];
  return candidates.flatMap((candidate) => {
    const parts = candidate.split(".");
    try {
      return [
        JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")),
      ];
    } catch {
      return [];
    }
  });
}

function vercelOrigin(name, value) {
  if (!value) return "";
  try {
    const parsed = new URL(`https://${value}`);
    if (
      parsed.username ||
      parsed.password ||
      parsed.port ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== "/" ||
      parsed.host !== value
    ) {
      throw new Error("invalid-vercel-host");
    }
    return parsed.origin;
  } catch {
    errors.push(`${name} no contiene un hostname válido.`);
    return "";
  }
}

const vercelIndicator = requireValue("VERCEL");
const vercelEnvironment = requireValue("VERCEL_ENV");
const vercelUrl = requireValue("VERCEL_URL");
const target = requireValue("SISTEMA_R_DEPLOYMENT_TARGET");
const dataSource = requireValue("SISTEMA_R_DATA_SOURCE");
const expectedProjectRef = requireValue(
  "SISTEMA_R_EXPECTED_SUPABASE_PROJECT_REF",
);
const siteUrl = requireValue("SISTEMA_R_SITE_URL");
const supabaseUrl = requireValue("SUPABASE_URL");
const publishableKey = requireValue("SUPABASE_PUBLISHABLE_KEY");
const usernameDomain = requireValue("SISTEMA_R_USERNAME_DOMAIN");
const currentDeploymentOrigin = vercelOrigin("VERCEL_URL", vercelUrl);
const branchOrigin = vercelOrigin(
  "VERCEL_BRANCH_URL",
  read("VERCEL_BRANCH_URL"),
);
const productionUrl =
  vercelEnvironment === "production"
    ? requireValue("VERCEL_PROJECT_PRODUCTION_URL")
    : read("VERCEL_PROJECT_PRODUCTION_URL");
const productionOrigin = vercelOrigin(
  "VERCEL_PROJECT_PRODUCTION_URL",
  productionUrl,
);

const targetByVercelEnvironment = {
  preview: "staging",
  production: "production",
};
if (vercelIndicator && vercelIndicator !== "1") {
  errors.push("VERCEL debe ser 1 en un build real de Vercel.");
}
if (!(vercelEnvironment in targetByVercelEnvironment)) {
  errors.push("VERCEL_ENV debe ser preview o production.");
} else if (target !== targetByVercelEnvironment[vercelEnvironment]) {
  errors.push(
    "SISTEMA_R_DEPLOYMENT_TARGET no corresponde al ambiente VERCEL_ENV.",
  );
}
if (target && target !== "staging" && target !== "production") {
  errors.push(
    "SISTEMA_R_DEPLOYMENT_TARGET debe ser staging o production.",
  );
}
if (dataSource && dataSource !== "supabase") {
  errors.push("SISTEMA_R_DATA_SOURCE debe ser supabase en Vercel.");
}

let resolvedProjectRef = "";
if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      (parsed.pathname !== "/" && parsed.pathname !== "")
    ) {
      throw new Error("invalid-origin");
    }
    const match = parsed.hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    if (!match) throw new Error("invalid-supabase-host");
    resolvedProjectRef = match[1].toLowerCase();
  } catch {
    errors.push(
      "SUPABASE_URL debe ser el origen HTTPS del proyecto hospedado en Supabase.",
    );
  }
}
if (
  expectedProjectRef &&
  !/^[a-z0-9]{8,40}$/.test(expectedProjectRef.toLowerCase())
) {
  errors.push("SISTEMA_R_EXPECTED_SUPABASE_PROJECT_REF no tiene formato válido.");
}
if (
  resolvedProjectRef &&
  expectedProjectRef &&
  resolvedProjectRef !== expectedProjectRef.toLowerCase()
) {
  errors.push(
    "SUPABASE_URL no coincide con SISTEMA_R_EXPECTED_SUPABASE_PROJECT_REF.",
  );
}

if (
  publishableKey &&
  !new RegExp(supabasePublishableKeyPatternSource).test(publishableKey)
) {
  errors.push(
    "SUPABASE_PUBLISHABLE_KEY debe usar una clave sb_publishable_ y nunca una clave privilegiada o legacy.",
  );
}

if (usernameDomain) {
  const usernameDomainPattern = new RegExp(usernameDomainPatternSource);
  if (!usernameDomainPattern.test(usernameDomain.toLowerCase())) {
    errors.push("SISTEMA_R_USERNAME_DOMAIN no contiene un dominio válido.");
  }
}

let resolvedSiteOrigin = "";
if (siteUrl) {
  try {
    const parsed = new URL(siteUrl);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.origin !== siteUrl
    ) {
      throw new Error("invalid-site-origin");
    }
    resolvedSiteOrigin = parsed.origin;
  } catch {
    errors.push(
      "SISTEMA_R_SITE_URL debe ser un origen HTTPS sin ruta, query ni barra final.",
    );
  }
}
const expectedSiteOrigin =
  vercelEnvironment === "preview"
    ? branchOrigin || currentDeploymentOrigin
    : vercelEnvironment === "production"
      ? productionOrigin
      : "";
if (
  resolvedSiteOrigin &&
  expectedSiteOrigin &&
  resolvedSiteOrigin !== expectedSiteOrigin
) {
  errors.push(
    "SISTEMA_R_SITE_URL no coincide con el origen canónico del despliegue Vercel.",
  );
}

for (const [name, rawValue] of Object.entries(process.env)) {
  const value = rawValue?.trim() ?? "";
  if (!value) continue;
  const upperName = name.toUpperCase();
  const forbiddenSupabaseName =
    upperName.includes("SUPABASE") &&
    (upperName.includes("SERVICE_ROLE") ||
      upperName.includes("SECRET") ||
      (upperName.includes("KEY") &&
        (upperName.includes("ANON") || upperName.includes("LEGACY"))));
  const payloads = jwtPayloads(value);
  const privilegedValue =
    /sb_secret_/i.test(value) ||
    payloads.some((payload) => payload?.role === "service_role");
  const legacySupabaseValue = payloads.some((payload) => {
    const supabaseIssuer =
      typeof payload?.iss === "string" &&
      payload.iss.toLowerCase().startsWith("supabase");
    const supabaseReference = typeof payload?.ref === "string";
    return (
      (supabaseIssuer || supabaseReference) &&
      ["anon", "authenticated", "service_role"].includes(payload?.role)
    );
  });
  if (forbiddenSupabaseName || privilegedValue || legacySupabaseValue) {
    errors.push(
      `La variable ${name} contiene o declara una clave privilegiada o legacy.`,
    );
  }
}

if (errors.length) {
  console.error(
    `Preflight de despliegue rechazado con ${errors.length} problema(s):`,
  );
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(
    `Preflight de despliegue aprobado: ${vercelEnvironment} → ${target}.`,
  );
}
