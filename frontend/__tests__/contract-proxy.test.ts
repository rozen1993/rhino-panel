import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ claims: vi.fn(), profile: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ getSupabaseEnvironment: () => ({ url: "https://example.invalid", publishableKey: "synthetic-key" }) }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({
  auth: { getClaims: mocks.claims },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profile }) }) }),
}) }));
import { updateSupabaseSession } from "@/lib/supabase/proxy";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.claims.mockResolvedValue({ data: null });
});
it.each(["/contrato", "/contrato?mes=2026-04", "/actividades/registro-historico"])("redirige sin sesión antes de transmitir %s", async (path) => {
  const response = await updateSupabaseSession(new NextRequest("https://example.invalid" + path));
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://example.invalid/acceso");
  expect(response.headers.get("x-robots-tag")).toContain("noindex");
  expect(mocks.profile).not.toHaveBeenCalled();
});
it("no restringe el acceso público", async () => {
  const response = await updateSupabaseSession(new NextRequest("https://example.invalid/acceso"));
  expect(response.headers.get("location")).toBeNull();
});
it.each([
  [{ role: "admin", is_active: false, must_change_password: false }, "/acceso"],
  [{ role: "admin", is_active: true, must_change_password: true }, "/cambiar-clave"],
] as const)("mantiene los controles del perfil al abrir contrato", async (profile, target) => {
  mocks.claims.mockResolvedValue({ data: { claims: { sub: "synthetic-admin" } } });
  mocks.profile.mockResolvedValue({ data: profile });
  const response = await updateSupabaseSession(new NextRequest("https://example.invalid/contrato?mes=2026-04"));
  expect(response.headers.get("location")).toBe("https://example.invalid" + target);
});
