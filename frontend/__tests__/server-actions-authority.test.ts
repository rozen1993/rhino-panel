import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActivityDraftFields } from "@/lib/activity-draft";
import type { SimulatedActivity } from "@/lib/activity-simulation";
import { roles } from "@/lib/roles";

const mocks = vi.hoisted(() => ({
  currentRole: vi.fn(),
  getActivity: vi.fn(),
  getBursonRequest: vi.fn(),
  invoke: vi.fn(),
  listAccounts: vi.fn(),
  revalidate: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/supabase/session", () => ({
  currentSupabaseRole: mocks.currentRole,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    functions: { invoke: mocks.invoke },
    rpc: mocks.rpc,
  }),
}));
vi.mock("@/lib/supabase/activities", () => ({
  getSupabaseActivity: mocks.getActivity,
  getSupabaseBursonRequest: mocks.getBursonRequest,
}));
vi.mock("@/lib/supabase/profiles", () => ({
  listSupabaseAccounts: mocks.listAccounts,
}));

import {
  advanceSupabaseActivityAction,
  createOwnSupabaseActivityAction,
  deleteSupabaseActivityMessageAction,
  editSupabaseActivityMessageAction,
  planSupabaseActivityAction,
  postSupabaseActivityMessageAction,
  replanSupabaseActivityAction,
  updateSupabaseExecutionAction,
} from "@/app/actividades/actions";
import { createSupabaseBursonRequestAction } from "@/app/burson/actions";
import {
  createSupabaseAccountAction,
  resetSupabaseTemporaryPasswordAction,
  setSupabaseOperatorCreationPermissionAction,
} from "@/app/cuentas/actions";

const activityId = "00000000-0000-4000-8000-000000000010";
const requestId = "00000000-0000-4000-8000-000000000011";
const operatorId = "00000000-0000-4000-8000-000000000012";
const messageId = "00000000-0000-4000-8000-000000000015";
const fields: ActivityDraftFields = {
  type: "Grabación",
  title: "Actividad probada",
  description: "Recorrido real de la acción de servidor.",
  placeName: "Lima",
  responsibleAccountId: operatorId,
  spans: [{ start: "2026-08-29", end: "2026-08-29" }],
  materialLink: "",
  notes: "",
  referenceLink: "",
};
const activity = {
  id: activityId,
  type: "Grabación",
  title: fields.title,
  responsible: "Ana Torres",
  responsibleAccountId: operatorId,
  status: "Programada",
  origin: "operario",
  spans: fields.spans,
  description: fields.description,
  place: fields.placeName,
  materialLink: "",
  operatorOpinion: "",
  referenceLink: "",
  createdByAccountId: operatorId,
  createdByRoleId: "operario",
  createdAt: "2026-08-29T12:00:00Z",
  updatedAt: "2026-08-29T12:00:00Z",
  version: 1,
  detailHydration: "complete",
  thread: [],
  audit: [],
} satisfies SimulatedActivity;

describe("autoridad ejecutada dentro de Server Actions", () => {
  it("transporta lugares por v2 y no reintenta en v1 cuando falta la migración", async () => {
    mocks.currentRole.mockResolvedValue({ ...roles.admin, accountId: "00000000-0000-4000-8000-000000000013" });
    const spans = [{ ...fields.spans[0], place: "Norte" }, { ...fields.spans[0], place: "Sur" }];
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
    const result = await planSupabaseActivityAction({ ...fields, spans }, requestId);
    expect(result).toEqual({ ok: false, error: expect.stringContaining("Falta actualizar el servidor") });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("plan_activity_v2", expect.objectContaining({ p_spans: spans }));
    expect(mocks.getActivity).not.toHaveBeenCalled();
    mocks.rpc.mockClear();
    const replan = await replanSupabaseActivityAction(activityId, 1, { ...fields, spans });
    expect(replan).toEqual({ ok: false, error: expect.stringContaining("Falta actualizar el servidor") });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("replan_activity_v2", expect.objectContaining({ p_spans: spans }));
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getActivity.mockResolvedValue(activity);
    mocks.getBursonRequest.mockResolvedValue({
      id: activityId,
      type: fields.type,
      title: fields.title,
      responsible: "Luis Mendoza",
      status: "Programada",
      spans: fields.spans,
      description: fields.description,
      place: fields.placeName,
      materialLink: "",
      referenceLink: "https://burson.example/referencia",
      createdAt: "2026-08-30T12:00:00Z",
      updatedAt: "2026-08-30T12:00:00Z",
    });
    mocks.listAccounts.mockResolvedValue([]);
    mocks.rpc.mockResolvedValue({
      data: [{ activity_id: activityId, activity_version: 1, replayed: false }],
      error: null,
    });
    mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it("rechaza planificar antes de llamar la RPC si el actor no es Admin", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.operario,
      accountId: operatorId,
    });
    const result = await planSupabaseActivityAction(fields, requestId);
    expect(result.ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("una clave temporal pendiente bloquea todas las mutaciones de actividad", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: "00000000-0000-4000-8000-000000000013",
      mustChangePassword: true,
    });
    expect((await planSupabaseActivityAction(fields, requestId)).ok).toBe(
      false,
    );
    expect(
      (await replanSupabaseActivityAction(activityId, 1, fields)).ok,
    ).toBe(false);

    mocks.currentRole.mockResolvedValue({
      ...roles.operario,
      accountId: operatorId,
      canCreateOwnActivities: true,
      mustChangePassword: true,
    });
    expect(
      (await createOwnSupabaseActivityAction(fields, requestId)).ok,
    ).toBe(false);
    expect(
      (
        await updateSupabaseExecutionAction(activityId, 1, {
          materialLink: "https://archivos.ejemplo.pe/entrega",
          notes: "Intento pendiente",
        })
      ).ok,
    ).toBe(false);
    expect((await advanceSupabaseActivityAction(activityId, 1)).ok).toBe(
      false,
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("la creación propia autorizada no acepta un responsable enviado", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.operario,
      accountId: operatorId,
      canCreateOwnActivities: true,
    });
    const result = await createOwnSupabaseActivityAction(fields, requestId);
    expect(result.ok).toBe(true);
    const [, args] = mocks.rpc.mock.calls[0];
    expect(mocks.rpc).toHaveBeenCalledWith(
      "create_own_activity_v2",
      expect.objectContaining({ p_idempotency_key: requestId }),
    );
    expect(args).not.toHaveProperty("p_responsible_id");
  });

  it("solo Admin llega a la RPC de replanificación", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.operario,
      accountId: operatorId,
    });
    expect(
      (await replanSupabaseActivityAction(activityId, 1, fields)).ok,
    ).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();

    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: "00000000-0000-4000-8000-000000000013",
    });
    expect(
      (await replanSupabaseActivityAction(activityId, 1, fields)).ok,
    ).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "replan_activity_v2",
      expect.objectContaining({
        p_activity_id: activityId,
        p_responsible_id: operatorId,
      }),
    );
  });

  it("solo Operario llega a la RPC de campos de ejecución", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: "00000000-0000-4000-8000-000000000013",
    });
    expect(
      (
        await updateSupabaseExecutionAction(activityId, 1, {
          materialLink: "https://archivos.ejemplo.pe/entrega",
          notes: "Lista para revisión",
        })
      ).ok,
    ).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();

    mocks.currentRole.mockResolvedValue({
      ...roles.operario,
      accountId: operatorId,
    });
    expect(
      (
        await updateSupabaseExecutionAction(activityId, 1, {
          materialLink: " https://archivos.ejemplo.pe/material de entrega ",
          notes: " Lista para revisión ",
        })
      ).ok,
    ).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("update_execution_v1", {
      p_activity_id: activityId,
      p_expected_version: 1,
      p_material_link: "https://archivos.ejemplo.pe/material%20de%20entrega",
      p_operator_opinion: "Lista para revisión",
    });
  });

  it("Burson no puede cambiar el estado y Operario usa la RPC dedicada", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.burson,
      accountId: "00000000-0000-4000-8000-000000000014",
    });
    expect((await advanceSupabaseActivityAction(activityId, 1)).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();

    mocks.currentRole.mockResolvedValue({
      ...roles.operario,
      accountId: operatorId,
    });
    expect((await advanceSupabaseActivityAction(activityId, 1)).ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("advance_activity_v1", {
      p_activity_id: activityId,
      p_expected_version: 1,
    });
  });

  it("Burson y una clave pendiente no alcanzan las RPC de conversación", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.burson,
      accountId: "00000000-0000-4000-8000-000000000014",
    });
    expect(
      (
        await postSupabaseActivityMessageAction(
          activityId,
          1,
          "Intento externo",
        )
      ).ok,
    ).toBe(false);
    expect(
      (await editSupabaseActivityMessageAction(messageId, 1, "Cambio")).ok,
    ).toBe(false);
    expect(
      (await deleteSupabaseActivityMessageAction(messageId, 1)).ok,
    ).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();

    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: "00000000-0000-4000-8000-000000000013",
      mustChangePassword: true,
    });
    expect(
      (
        await postSupabaseActivityMessageAction(
          activityId,
          1,
          "Intento pendiente",
        )
      ).ok,
    ).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("abre y responde sin aceptar identidad ni responsable del cliente", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: "00000000-0000-4000-8000-000000000013",
    });
    expect(
      (
        await postSupabaseActivityMessageAction(
          activityId,
          1,
          "  Revisión iniciada  ",
        )
      ).ok,
    ).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("post_activity_message_v1", {
      p_activity_id: activityId,
      p_expected_activity_version: 1,
      p_body: "Revisión iniciada",
    });
    const [, openingArgs] = mocks.rpc.mock.calls[0];
    expect(openingArgs).not.toHaveProperty("p_author_id");
    expect(openingArgs).not.toHaveProperty("p_author_role");
    expect(openingArgs).not.toHaveProperty("p_responsible_id");

    mocks.rpc.mockClear();
    mocks.currentRole.mockResolvedValue({
      ...roles.operario,
      accountId: operatorId,
    });
    expect(
      (
        await postSupabaseActivityMessageAction(
          activityId,
          null,
          "Respuesta del responsable",
        )
      ).ok,
    ).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("post_activity_message_v1", {
      p_activity_id: activityId,
      p_expected_activity_version: null,
      p_body: "Respuesta del responsable",
    });
  });

  it("edita y elimina mediante versión propia del mensaje", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.operario,
      accountId: operatorId,
    });
    expect(
      (
        await editSupabaseActivityMessageAction(
          messageId,
          3,
          "  Texto corregido  ",
        )
      ).ok,
    ).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("edit_activity_message_v1", {
      p_message_id: messageId,
      p_expected_message_version: 3,
      p_body: "Texto corregido",
    });

    mocks.rpc.mockClear();
    expect(
      (await deleteSupabaseActivityMessageAction(messageId, 4)).ok,
    ).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("delete_activity_message_v1", {
      p_message_id: messageId,
      p_expected_message_version: 4,
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/actividades");
    expect(mocks.revalidate).toHaveBeenCalledWith(
      `/actividades/${activityId}`,
    );
    expect(mocks.revalidate).not.toHaveBeenCalledWith("/burson");
  });

  it("rechaza cuerpos, identificadores y versiones inválidos antes de la RPC", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: "00000000-0000-4000-8000-000000000013",
    });
    expect(
      (await postSupabaseActivityMessageAction(activityId, 1, "   ")).ok,
    ).toBe(false);
    expect(
      (
        await postSupabaseActivityMessageAction(
          activityId,
          1,
          "x".repeat(5001),
        )
      ).ok,
    ).toBe(false);
    expect(
      (
        await editSupabaseActivityMessageAction(
          "mensaje-inválido",
          1,
          "Texto",
        )
      ).ok,
    ).toBe(false);
    expect(
      (await deleteSupabaseActivityMessageAction(messageId, 0)).ok,
    ).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("traduce el estado de conversación sin filtrar mensajes SQL", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: "00000000-0000-4000-8000-000000000013",
    });
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "SR008", message: "internal database detail" },
    });
    const result = await postSupabaseActivityMessageAction(
      activityId,
      1,
      "Abrir hilo",
    );
    expect(result).toEqual({
      ok: false,
      error: "La conversación todavía no está disponible.",
    });
  });

  it("canal retirado: Burson crea un encargo sin poder elegir responsable ni ejecución", async () => {
    mocks.currentRole.mockResolvedValue({...roles.burson, createsBursonRequests:true});
    expect((await createSupabaseBursonRequestAction(fields, requestId)).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("rechaza otras capacidades y referencias inseguras antes de la RPC Burson", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.operario,
      accountId: operatorId,
      bursonLinked: true,
      canCreateOwnActivities: true,
    });
    expect(
      (await createSupabaseBursonRequestAction(fields, requestId)).ok,
    ).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();

    mocks.currentRole.mockResolvedValue({
      ...roles.burson,
      accountId: "00000000-0000-4000-8000-000000000014",
    });
    expect(
      (
        await createSupabaseBursonRequestAction(
          { ...fields, referenceLink: "https://usuario:clave@example.com" },
          requestId,
        )
      ).ok,
    ).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("canal retirado: normaliza la referencia antes de calcularla en la RPC Burson", async () => {
    mocks.currentRole.mockResolvedValue({...roles.burson, createsBursonRequests:true});
    expect((await createSupabaseBursonRequestAction(fields, requestId)).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("bloquea la acción Burson mientras la clave temporal siga pendiente", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.burson,
      accountId: "00000000-0000-4000-8000-000000000014",
      mustChangePassword: true,
    });
    expect(
      (await createSupabaseBursonRequestAction(fields, requestId)).ok,
    ).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("canal retirado: propaga el replay idempotente de un encargo Burson", async () => {
    mocks.currentRole.mockResolvedValue({...roles.burson, createsBursonRequests:true});
    expect((await createSupabaseBursonRequestAction(fields, requestId)).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("el llamador real del permiso usa la RPC dedicada", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: "00000000-0000-4000-8000-000000000013",
    });
    const result = await setSupabaseOperatorCreationPermissionAction(
      operatorId,
      true,
    );
    expect(result.ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "set_operator_creation_permission_v1",
      { p_operator_id: operatorId, p_enabled: true },
    );
  });

  it("una cuenta Admin con clave pendiente no puede invocar el alta privilegiada", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: "00000000-0000-4000-8000-000000000013",
      mustChangePassword: true,
    });
    const result = await createSupabaseAccountAction({
      name: "Nueva Persona",
      username: "nueva.persona",
      password: "Temporal9!Clave",
      roleId: "operario",
      bursonLinked: false,
      canCreateOwnActivities: false,
    });
    expect(result.ok).toBe(false);
    expect(mocks.invoke).not.toHaveBeenCalled();
  });

  it("conserva el código accionable de los fallos de Edge Functions", async () => {
    mocks.currentRole.mockResolvedValue({
      ...roles.admin,
      accountId: "00000000-0000-4000-8000-000000000013",
    });
    mocks.invoke.mockResolvedValueOnce({
      data: null,
      error: {
        context: new Response(
          JSON.stringify({ code: "profile_create_cleanup_pending" }),
          { status: 409 },
        ),
      },
    });
    const createResult = await createSupabaseAccountAction({
      name: "Nueva Persona",
      username: "nueva.persona",
      password: "Temporal9!Clave",
      roleId: "operario",
      bursonLinked: false,
      canCreateOwnActivities: false,
    });
    expect(createResult).toEqual({
      ok: false,
      error:
        "No se creó el perfil y la limpieza quedó pendiente; reintenta el mismo usuario.",
    });

    mocks.invoke.mockResolvedValueOnce({
      data: null,
      error: {
        context: new Response(
          JSON.stringify({ code: "reset_confirm_failed" }),
          { status: 409 },
        ),
      },
    });
    const resetResult = await resetSupabaseTemporaryPasswordAction(
      operatorId,
      "Temporal9!Clave",
    );
    expect(resetResult).toEqual({
      ok: false,
      error:
        "Auth sí cambió esta clave, pero la auditoría no se confirmó. No la entregues: genera otra.",
    });
  });
});
