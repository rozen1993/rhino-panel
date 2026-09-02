import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = resolve(
  process.cwd(),
  "scripts",
  "check-deployment-readiness.mjs",
);

function isolatedEnvironment(
  overrides: Record<string, string | undefined> = {},
) {
  const environment: NodeJS.ProcessEnv = { NODE_ENV: "test" };
  for (const name of [
    "SystemRoot",
    "WINDIR",
    "PATH",
    "PATHEXT",
    "ComSpec",
    "TEMP",
    "TMP",
  ]) {
    if (process.env[name]) environment[name] = process.env[name];
  }
  Object.assign(environment, {
    VERCEL: "1",
    VERCEL_ENV: "preview",
    VERCEL_URL: "sistema-r-preview-deploy.vercel.app",
    VERCEL_BRANCH_URL: "sistema-r-preview.vercel.app",
    VERCEL_PROJECT_PRODUCTION_URL: "sistema-r.vercel.app",
    SISTEMA_R_DEPLOYMENT_TARGET: "staging",
    SISTEMA_R_DATA_SOURCE: "supabase",
    SISTEMA_R_EXPECTED_SUPABASE_PROJECT_REF: "stagingref12345678",
    SISTEMA_R_SITE_URL: "https://sistema-r-preview.vercel.app",
    SUPABASE_URL: "https://stagingref12345678.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_1234567890",
    SISTEMA_R_USERNAME_DOMAIN: "auth.sistema-r.invalid",
  });
  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) delete environment[name];
    else environment[name] = value;
  }
  return environment;
}

function run(overrides: Record<string, string | undefined> = {}) {
  return spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: isolatedEnvironment(overrides),
  });
}

function output(result: ReturnType<typeof run>) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

describe("preflight aislado de Preview y producción", () => {
  it("acepta únicamente Preview conectado al target staging esperado", () => {
    const result = run();
    expect(result.status).toBe(0);
    expect(output(result)).toContain("preview → staging");
    expect(output(result)).not.toContain("stagingref12345678");
  });

  it("acepta Production conectado a otro target y origen HTTPS", () => {
    const result = run({
      VERCEL_ENV: "production",
      VERCEL_URL: "sistema-r-production-deploy.vercel.app",
      VERCEL_BRANCH_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: "sistema-r.example.com",
      SISTEMA_R_DEPLOYMENT_TARGET: "production",
      SISTEMA_R_EXPECTED_SUPABASE_PROJECT_REF: "productionref123456",
      SISTEMA_R_SITE_URL: "https://sistema-r.example.com",
      SUPABASE_URL: "https://productionref123456.supabase.co",
    });
    expect(result.status).toBe(0);
    expect(output(result)).toContain("production → production");
    expect(output(result)).not.toContain("productionref123456");
  });

  it("usa VERCEL_URL como fallback si Preview no tiene URL de rama", () => {
    const result = run({
      VERCEL_BRANCH_URL: undefined,
      SISTEMA_R_SITE_URL: "https://sistema-r-preview-deploy.vercel.app",
    });
    expect(result.status).toBe(0);
  });

  const invalidCases: Array<
    [string, Record<string, string | undefined>, string]
  > = [
    ["indicador Vercel ausente", { VERCEL: undefined }, "VERCEL"],
    ["indicador Vercel falso", { VERCEL: "0" }, "debe ser 1"],
    ["VERCEL_ENV ausente", { VERCEL_ENV: undefined }, "VERCEL_ENV"],
    ["VERCEL_URL ausente", { VERCEL_URL: undefined }, "VERCEL_URL"],
    [
      "VERCEL_URL con protocolo",
      { VERCEL_URL: "https://sistema-r-preview.vercel.app" },
      "hostname válido",
    ],
    [
      "VERCEL_ENV no desplegable",
      { VERCEL_ENV: "development" },
      "preview o production",
    ],
    [
      "Preview apuntando a producción",
      { SISTEMA_R_DEPLOYMENT_TARGET: "production" },
      "no corresponde",
    ],
    [
      "target desconocido",
      { SISTEMA_R_DEPLOYMENT_TARGET: "qa" },
      "staging o production",
    ],
    [
      "target ausente",
      { SISTEMA_R_DEPLOYMENT_TARGET: undefined },
      "SISTEMA_R_DEPLOYMENT_TARGET",
    ],
    [
      "modo demo",
      { SISTEMA_R_DATA_SOURCE: "demo" },
      "debe ser supabase",
    ],
    [
      "modo ausente",
      { SISTEMA_R_DATA_SOURCE: undefined },
      "SISTEMA_R_DATA_SOURCE",
    ],
    [
      "Supabase por HTTP",
      { SUPABASE_URL: "http://stagingref12345678.supabase.co" },
      "SUPABASE_URL",
    ],
    [
      "Supabase local",
      { SUPABASE_URL: "https://127.0.0.1" },
      "SUPABASE_URL",
    ],
    [
      "clave legacy",
      { SUPABASE_PUBLISHABLE_KEY: "eyJlegacy.anon.signature" },
      "sb_publishable_",
    ],
    [
      "clave secreta",
      { SUPABASE_PUBLISHABLE_KEY: "sb_secret_DO_NOT_USE" },
      "SUPABASE_PUBLISHABLE_KEY",
    ],
    [
      "project ref distinto",
      { SISTEMA_R_EXPECTED_SUPABASE_PROJECT_REF: "anotherref12345678" },
      "no coincide",
    ],
    [
      "project ref ausente",
      { SISTEMA_R_EXPECTED_SUPABASE_PROJECT_REF: undefined },
      "SISTEMA_R_EXPECTED_SUPABASE_PROJECT_REF",
    ],
    [
      "service role en Vercel",
      { SUPABASE_SERVICE_ROLE_KEY: "DO_NOT_LEAK_SERVICE_ROLE" },
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    [
      "secreto público",
      { NEXT_PUBLIC_SUPABASE_SECRET_KEY: "sb_secret_DO_NOT_LEAK_PUBLIC" },
      "NEXT_PUBLIC_SUPABASE_SECRET_KEY",
    ],
    [
      "origen público por HTTP",
      { SISTEMA_R_SITE_URL: "http://sistema-r-preview.vercel.app" },
      "SISTEMA_R_SITE_URL",
    ],
    [
      "origen público con barra final",
      { SISTEMA_R_SITE_URL: "https://sistema-r-preview.vercel.app/" },
      "SISTEMA_R_SITE_URL",
    ],
    [
      "origen público ajeno al Preview",
      { SISTEMA_R_SITE_URL: "https://otro-preview.vercel.app" },
      "no coincide",
    ],
    [
      "origen canónico de Production ausente",
      {
        VERCEL_ENV: "production",
        VERCEL_BRANCH_URL: undefined,
        VERCEL_PROJECT_PRODUCTION_URL: undefined,
        SISTEMA_R_DEPLOYMENT_TARGET: "production",
        SISTEMA_R_SITE_URL: "https://sistema-r.example.com",
      },
      "VERCEL_PROJECT_PRODUCTION_URL",
    ],
    [
      "dominio de usuario inválido",
      { SISTEMA_R_USERNAME_DOMAIN: "dominio-invalido" },
      "SISTEMA_R_USERNAME_DOMAIN",
    ],
  ];

  it.each(invalidCases)("rechaza %s", (_, overrides, expected) => {
    const result = run(overrides);
    expect(result.status).toBe(1);
    expect(output(result)).toContain(expected);
  });

  it("detecta un JWT service_role aun bajo un nombre no privilegiado", () => {
    const encoded = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const token = `${encoded({ alg: "none" })}.${encoded({ role: "service_role" })}.signature`;
    const result = run({ NEXT_PUBLIC_UNRELATED_TOKEN: token });
    expect(result.status).toBe(1);
    expect(output(result)).toContain("NEXT_PUBLIC_UNRELATED_TOKEN");
    expect(output(result)).not.toContain(token);
  });

  it("detecta una clave Supabase legacy anon bajo un nombre arbitrario", () => {
    const encoded = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const token = `${encoded({ alg: "HS256" })}.${encoded({ iss: "supabase", role: "anon" })}.signature`;
    const result = run({ NEXT_PUBLIC_UNRELATED_TOKEN: token });
    expect(result.status).toBe(1);
    expect(output(result)).toContain("NEXT_PUBLIC_UNRELATED_TOKEN");
    expect(output(result)).not.toContain(token);
  });

  it("detecta una clave legacy embebida y emisores locales de Supabase", () => {
    const encoded = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const token = `${encoded({ alg: "HS256" })}.${encoded({ iss: "supabase-demo", role: "anon" })}.signature`;
    const embedded = JSON.stringify({ credential: token });
    const result = run({ UNRELATED_CONFIGURATION: embedded });
    expect(result.status).toBe(1);
    expect(output(result)).toContain("UNRELATED_CONFIGURATION");
    expect(output(result)).not.toContain(token);
    expect(output(result)).not.toContain(embedded);
  });

  it("detecta una clave secreta embebida sin imprimirla", () => {
    const embedded =
      "postgresql://user:sb_secret_EMBEDDED_DO_NOT_LEAK@example.invalid/db";
    const result = run({ UNRELATED_DATABASE_URL: embedded });
    expect(result.status).toBe(1);
    expect(output(result)).toContain("UNRELATED_DATABASE_URL");
    expect(output(result)).not.toContain(embedded);
    expect(output(result)).not.toContain("sb_secret_EMBEDDED_DO_NOT_LEAK");
  });

  it("no confunde un JWT ajeno no privilegiado con una clave Supabase", () => {
    const encoded = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const token = `${encoded({ alg: "HS256" })}.${encoded({ iss: "otro", role: "anon" })}.signature`;
    expect(run({ UNRELATED_TOKEN: token }).status).toBe(0);
  });

  it("acumula fallos sin imprimir ningún valor sensible", () => {
    const secret = "DO_NOT_LEAK_THIS_EXACT_VALUE";
    const result = run({
      VERCEL_ENV: "development",
      SISTEMA_R_DATA_SOURCE: "demo",
      SISTEMA_R_SITE_URL: "http://localhost:3000",
      SUPABASE_SERVICE_ROLE_KEY: secret,
    });
    const combined = output(result);
    expect(result.status).toBe(1);
    expect(combined).toContain("VERCEL_ENV");
    expect(combined).toContain("SISTEMA_R_DATA_SOURCE");
    expect(combined).toContain("SISTEMA_R_SITE_URL");
    expect(combined).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(combined).not.toContain(secret);
  });
});
