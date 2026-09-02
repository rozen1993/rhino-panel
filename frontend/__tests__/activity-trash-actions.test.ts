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
});
