import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "..");
const config = readFileSync(resolve(root, "supabase", "config.toml"), "utf8");
const vercel = JSON.parse(
  readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"),
) as { regions?: string[] };
const envExample = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");

describe("contrato de staging", () => {
  it("cierra el registro público y servicios fuera de alcance", () => {
    expect(config.match(/enable_signup = false/g)).toHaveLength(3);
    expect(config).toMatch(/\[db\.seed\][\s\S]*?enabled = false/);
    expect(config).toMatch(/\[realtime\]\r?\nenabled = false/);
    expect(config).toMatch(/\[storage\]\r?\nenabled = false/);
  });

  it("acerca Vercel a Supabase Oregon", () => {
    expect(vercel.regions).toEqual(["pdx1"]);
  });

  it("documenta solo la clave publicable y nunca una clave privilegiada", () => {
    expect(envExample).toContain("SUPABASE_PUBLISHABLE_KEY");
    expect(envExample).not.toMatch(/^SUPABASE_SECRET_KEY=/m);
    expect(envExample).not.toMatch(/^SUPABASE_SERVICE_ROLE_KEY=/m);
  });
});
