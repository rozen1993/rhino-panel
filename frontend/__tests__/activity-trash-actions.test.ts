import { beforeEach, describe, expect, it, vi } from "vitest";
import { roles } from "@/lib/roles";

const mocks = vi.hoisted(() => ({
  currentRole: vi.fn(),
  revalidate: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/supabase/session", () => ({
  currentSupabaseRole: mocks.currentRole,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ rpc: mocks.rpc }),
}));

import {
  restoreSupabaseActivityAction,
  softDeleteSupabaseActivityAction,
  softDeleteOwnSupabaseActivityAction,
} from "@/app/papelera/actions";

const activityId = "00000000-0000-4000-8000-000000000510";
const operatorId = "00000000-0000-4000-8000-000000000511";

describe("autoridad de las Server Actions de Papelera", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: "00000000-0000-4000-8000-000000000512",
    });
    mocks.rpc.mockResolvedValue({
      data: [{ activity_id: activityId, activity_version: 2 }],
      error: null,
    });
  });

  it("impide que Operario, Burson o una clave temporal alcancen las RPC", async () => {
    for (const role of [roles.operario, roles.burson]) {
      mocks.currentRole.mockResolvedValue({ ...role, accountId: operatorId });
      expect(
        (await softDeleteSupabaseActivityAction(activityId, 1, "Motivo válido"))
          .ok,
      ).toBe(false);
      expect(
        (await restoreSupabaseActivityAction(activityId, 1, null)).ok,
      ).toBe(false);
    }
    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: operatorId,
      mustChangePassword: true,
    });
    expect(
      (await softDeleteSupabaseActivityAction(activityId, 1, "Motivo válido"))
        .ok,
    ).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("valida UUID, versión y motivo antes de invocar Supabase", async () => {
    expect(
      (await softDeleteSupabaseActivityAction("inválido", 1, "Motivo válido"))
        .ok,
    ).toBe(false);
    expect(
      (await softDeleteSupabaseActivityAction(activityId, 0, "Motivo válido"))
        .ok,
    ).toBe(false);
    expect(
      (await softDeleteSupabaseActivityAction(activityId, 1, "x")).ok,
    ).toBe(false);
    expect(
      (await restoreSupabaseActivityAction(activityId, 1, "inválido")).ok,
    ).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("envía solo datos de negocio y revalida todas las superficies", async () => {
    expect(
      (
        await softDeleteSupabaseActivityAction(
          activityId,
          4,
          "  Duplicado confirmado  ",
        )
      ).ok,
    ).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("soft_delete_activity_v1", {
      p_activity_id: activityId,
      p_expected_version: 4,
      p_reason: "Duplicado confirmado",
    });
    const [, args] = mocks.rpc.mock.calls[0];
    expect(args).not.toHaveProperty("p_actor_id");
    expect(args).not.toHaveProperty("p_role");
    for (const path of [
      "/papelera",
      "/actividades",
      `/actividades/${activityId}`,
      "/historico",
      "/burson",
      `/burson/${activityId}`,
    ])
      expect(mocks.revalidate).toHaveBeenCalledWith(path);
  });

  it("restaura con responsable opcional y conserva la autoridad en servidor", async () => {
    expect(
      (await restoreSupabaseActivityAction(activityId, 7, operatorId)).ok,
    ).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("restore_activity_v1", {
      p_activity_id: activityId,
      p_expected_version: 7,
      p_responsible_id: operatorId,
    });
    const [, args] = mocks.rpc.mock.calls[0];
    expect(args).not.toHaveProperty("p_actor_id");
    expect(args).not.toHaveProperty("p_role");
  });

  it("traduce el caso de responsable inactivo sin filtrar el error SQL", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: "SR009",
        message: "restore requires an active responsible",
      },
    });
    expect(
      await restoreSupabaseActivityAction(activityId, 3, null),
    ).toEqual({
      ok: false,
      error:
        "El responsable ya no está activo. Elige un Operario activo para restaurar.",
    });
  });

  it("impide cambiar el responsable histórico al restaurar una entrega", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: "SR009",
        message: "delivered activity keeps its historical responsible",
      },
    });
    expect(
      await restoreSupabaseActivityAction(activityId, 3, operatorId),
    ).toEqual({
      ok: false,
      error:
        "Una actividad entregada debe conservar a su responsable histórico.",
    });
  });

  it("ofrece reintento cuando PostgreSQL aborta una carrera", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "40P01", message: "deadlock detected" },
    });
    expect(
      await softDeleteSupabaseActivityAction(
        activityId,
        3,
        "Baja concurrente",
      ),
    ).toEqual({
      ok: false,
      error: "La operación coincidió con otro cambio. Inténtalo nuevamente.",
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("el flujo propio exige Operario, cuenta, permiso vigente y clave lista", async () => {
    for (const role of [null, roles.admin, roles.aunor, roles.burson, roles.operario,
      { ...roles.operario, canCreateOwnActivities: true },
      { ...roles.operario, accountId: operatorId, canCreateOwnActivities: true, mustChangePassword: true }]) {
      mocks.currentRole.mockResolvedValue(role);
      expect((await softDeleteOwnSupabaseActivityAction(activityId, 1, "Error de planificación")).ok).toBe(false);
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("usa exclusivamente la RPC propia autenticada y refresca Aunor", async () => {
    mocks.currentRole.mockResolvedValue({ ...roles.operario, accountId: operatorId, canCreateOwnActivities: true });
    expect((await softDeleteOwnSupabaseActivityAction(activityId, 3, "  Error de planificación  ")).ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("soft_delete_own_activity_v1", {
      p_activity_id: activityId, p_expected_version: 3, p_reason: "Error de planificación",
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/aunor", "layout");
  });
  it.each(["SR001", "SR002", "PGRST202", "42883"])("no reintenta por otro canal si el servidor rechaza: %s", async code => {
    mocks.currentRole.mockResolvedValue({ ...roles.operario, accountId: operatorId, canCreateOwnActivities: true });
    mocks.rpc.mockResolvedValue({ data: null, error: { code } });
    expect((await softDeleteOwnSupabaseActivityAction(activityId, 3, "Error de planificación")).ok).toBe(false);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("rechaza UUID, motivo y versión inválidos también en la baja propia", async () => {
    mocks.currentRole.mockResolvedValue({ ...roles.operario, accountId: operatorId, canCreateOwnActivities: true });
    for (const [id, version, reason] of [["invalido", 1, "Error"], [activityId, 0, "Error"], [activityId, 1, " "], [activityId, 1, "x".repeat(1001)]] as const)
      expect((await softDeleteOwnSupabaseActivityAction(id, version, reason)).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
