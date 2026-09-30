import { beforeEach, it, expect, vi } from "vitest";
import { roles } from "@/lib/roles";
const mocks = vi.hoisted(() => ({ role: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/session", () => ({ currentRole: mocks.role }));
vi.mock("@/lib/data-source", () => ({ resolveDataSource: () => "supabase" }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ rpc: mocks.rpc }),
}));
vi.mock("@/lib/supabase/activities", () => ({
  getSupabaseActivity: vi.fn().mockResolvedValue(null),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveAdminActivityAction } from "@/app/aunor/admin-management-actions";
const id = "00000000-0000-4000-8000-000000000010";
const input = {
  command: "relation" as const,
  activityId: id,
  requestId: id,
  activityVersion: 1,
  publicationVersion: 0,
  summary: "Resumen",
  serviceId: "cobertura",
  periodId: null,
  notPerformedReason: "",
  confirmed: true,
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.role.mockResolvedValue(roles.admin);
  mocks.rpc.mockResolvedValue({ error: null });
});
it("deniega cliente, operario y credencial pendiente antes de llegar a SQL", async () => {
  for (const role of [
    null,
    roles.aunor,
    roles.operario,
    { ...roles.admin, mustChangePassword: true },
  ]) {
    mocks.role.mockResolvedValue(role);
    expect((await saveAdminActivityAction(input)).ok).toBe(false);
  }
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("usa una sola RPC y nunca la contraseña ni datos internos del demo en remoto", async () => {
  expect((await saveAdminActivityAction(input)).ok).toBe(true);
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
  expect(mocks.rpc).toHaveBeenCalledWith(
    "save_admin_activity_bundle_v1",
    expect.objectContaining({
      p_command: "relation",
      p_request_id: id,
      p_payload: expect.objectContaining({
        publicationVersion: 0,
        confirmed: true,
      }),
    }),
  );
});
it("no oculta conflictos de versión ni intenta guardados parciales", async () => {
  mocks.rpc.mockResolvedValue({ error: { code: "SR001" } });
  const result = await saveAdminActivityAction(input);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error).toContain("cambió");
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
});
