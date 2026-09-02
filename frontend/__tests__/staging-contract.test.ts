import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { usernameDomainPatternSource } from "@/lib/supabase/identity";
import { supabasePublishableKeyPatternSource } from "@/lib/supabase/env";

const root = resolve(process.cwd(), "..");
const config = readFileSync(resolve(root, "supabase", "config.toml"), "utf8");
const vercel = JSON.parse(
  readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"),
) as { buildCommand?: string; regions?: string[] };
const envExample = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
const deploymentPreflight = readFileSync(
  resolve(process.cwd(), "scripts", "check-deployment-readiness.mjs"),
  "utf8",
);

describe("contrato de staging", () => {
  it("cierra el registro público y servicios fuera de alcance", () => {
    expect(config.match(/enable_signup = false/g)).toHaveLength(3);
    expect(config).toMatch(/\[db\.seed\][\s\S]*?enabled = false/);
    expect(config).toMatch(/\[realtime\]\r?\nenabled = false/);
    expect(config).toMatch(/\[storage\]\r?\nenabled = false/);
  });

  it("acerca Vercel a Supabase Oregon", () => {
    expect(vercel.regions).toEqual(["pdx1"]);
    expect(vercel.buildCommand).toBe("npm run build:vercel");
  });

  it("documenta solo la clave publicable y nunca una clave privilegiada", () => {
    expect(envExample).toContain("SUPABASE_PUBLISHABLE_KEY");
    expect(envExample).not.toMatch(/^SUPABASE_SECRET_KEY=/m);
    expect(envExample).not.toMatch(/^SUPABASE_SERVICE_ROLE_KEY=/m);
    expect(envExample).toContain("SISTEMA_R_DEPLOYMENT_TARGET=staging");
    expect(envExample).toContain("SISTEMA_R_DEPLOYMENT_TARGET=production");
    expect(envExample).toContain(
      "SISTEMA_R_EXPECTED_SUPABASE_PROJECT_REF",
    );
    expect(envExample).toContain("SISTEMA_R_SITE_URL");
  });

  it("mantiene sincronizada la validación del dominio interno", () => {
    const sourceLiteral = deploymentPreflight.match(
      /const usernameDomainPatternSource\s*=\s*("[^\r\n]+")\s*;/,
    )?.[1];
    expect(sourceLiteral).toBeDefined();
    expect(JSON.parse(sourceLiteral ?? '""')).toBe(usernameDomainPatternSource);
  });

  it("mantiene sincronizada la política de clave publicable", () => {
    const sourceLiteral = deploymentPreflight.match(
      /const supabasePublishableKeyPatternSource\s*=\s*("[^\r\n]+")\s*;/,
    )?.[1];
    expect(sourceLiteral).toBeDefined();
    expect(JSON.parse(sourceLiteral ?? '""')).toBe(
      supabasePublishableKeyPatternSource,
    );
  });
});
