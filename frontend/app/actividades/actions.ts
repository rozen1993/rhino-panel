"use server";

import { revalidatePath } from "next/cache";
import type { ActivityDraftFields } from "@/lib/activity-draft";
import { activityPlanningError } from "@/lib/activity-validation";
import { safeMaterialUrl } from "@/lib/external-link";
import type { SimulatedActivity } from "@/lib/activity-simulation";
import { getSupabaseActivity } from "@/lib/supabase/activities";
import { currentSupabaseRole } from "@/lib/supabase/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

export type ActivityServerResult =
  | { ok: true; activity: SimulatedActivity; replayed?: boolean }
  | { ok: false; error: string };

function validateExecution(
  fields: unknown,
) {
  if (!fields || typeof fields !== "object")
    return "Los campos de ejecución no son válidos.";
  const candidate = fields as Partial<
    Pick<ActivityDraftFields, "materialLink" | "notes">
  >;
  if (
    typeof candidate.materialLink !== "string" ||
    typeof candidate.notes !== "string" ||
    candidate.notes.length > 5000
  )
    return "Los campos de ejecución no son válidos.";
  if (candidate.materialLink && !safeMaterialUrl(candidate.materialLink))
    return "Usa un enlace HTTPS válido sin credenciales incrustadas.";
  return null;
}

function errorMessage(error: { code?: string; message?: string }) {
  const messages: Record<string, string> = {
    PGRST202: "Falta actualizar el servidor para guardar lugares por jornada. No se guardaron cambios.",
    SR011: "Actualiza la aplicación antes de replanificar: esta actividad tiene lugares por jornada.",
    SR001: "La actividad cambió; recarga antes de guardar.",
    SR002: "No tienes permiso para realizar esta acción.",
    SR003: "Completa los datos obligatorios con valores válidos.",
    SR004: "La actividad ya fue entregada.",
    SR005: "Añade un enlace HTTPS válido antes de entregar.",
    SR006:
      "La misma solicitud ya se usó con datos diferentes. Recarga el formulario.",
    SR007:
      "Admin inició la conversación; el enlace y la opinión están bloqueados.",
    SR008: "La conversación todavía no está disponible.",
    SR009: "La operación rompería una asignación obligatoria.",
    SR010: "La actividad ya cambió de estado en la Papelera.",
  };
  return messages[error.code ?? ""] ?? "No se pudo completar la operación.";
}

function conversationErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "SR001")
    return "La conversación cambió; recarga antes de continuar.";
  return errorMessage(error);
}

function normalizedMessageBody(value: unknown) {
  if (typeof value !== "string") return null;
  const body = value.trim();
  return body.length > 0 && body.length <= 5000 ? body : null;
}

function isPositiveVersion(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

async function canUseInternalConversation() {
  const role = await currentActiveSupabaseRole();
  return Boolean(
    role && (role.id === "admin" || role.id === "operario"),
  );
}

async function currentActiveSupabaseRole() {
  const role = await currentSupabaseRole();
  return role && !role.mustChangePassword ? role : null;
}

async function refreshActivity(id: string): Promise<ActivityServerResult> {
  const activity = await getSupabaseActivity(id);
  if (!activity) return { ok: false, error: "La actividad no existe." };
  revalidatePath("/actividades");
  revalidatePath(`/actividades/${id}`);
  return { ok: true, activity };
}

export async function planSupabaseActivityAction(
  fields: ActivityDraftFields,
  idempotencyKey: string,
): Promise<ActivityServerResult> {
  const role = await currentActiveSupabaseRole();
  if (role?.id !== "admin")
    return { ok: false, error: "Solo Admin puede planificar actividades." };
  const validation = activityPlanningError(fields);
  if (validation) return { ok: false, error: validation };
  if (!isUuid(idempotencyKey) || !isUuid(fields.responsibleAccountId))
    return { ok: false, error: "La solicitud o el responsable no son válidos." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("plan_activity_v2", {
    p_idempotency_key: idempotencyKey,
    p_responsible_id: fields.responsibleAccountId,
    p_type: fields.type,
    p_title: fields.title,
    p_description: fields.description,
    p_place: fields.placeName,
    p_spans: fields.spans,
  });
  if (error || !data?.[0]) return { ok: false, error: errorMessage(error ?? {}) };
  const result = await refreshActivity(data[0].activity_id);
  return result.ok ? { ...result, replayed: data[0].replayed } : result;
}

export async function createOwnSupabaseActivityAction(
  fields: ActivityDraftFields,
  idempotencyKey: string,
): Promise<ActivityServerResult> {
  const role = await currentActiveSupabaseRole();
  if (role?.id !== "operario" || !role.canCreateOwnActivities)
    return {
      ok: false,
      error: "Admin no te concedió permiso para crear actividades propias.",
    };
  const validation = activityPlanningError(fields);
  if (validation) return { ok: false, error: validation };
  if (!isUuid(idempotencyKey))
    return { ok: false, error: "La solicitud no contiene una clave válida." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_own_activity_v2", {
    p_idempotency_key: idempotencyKey,
    p_type: fields.type,
    p_title: fields.title,
    p_description: fields.description,
    p_place: fields.placeName,
    p_spans: fields.spans,
  });
  if (error || !data?.[0]) return { ok: false, error: errorMessage(error ?? {}) };
  const result = await refreshActivity(data[0].activity_id);
  return result.ok ? { ...result, replayed: data[0].replayed } : result;
}

export async function replanSupabaseActivityAction(
  id: string,
  expectedVersion: number,
  fields: ActivityDraftFields,
): Promise<ActivityServerResult> {
  const role = await currentActiveSupabaseRole();
  if (role?.id !== "admin")
    return { ok: false, error: "Solo Admin puede modificar la planificación." };
  const validation = activityPlanningError(fields);
  if (validation) return { ok: false, error: validation };
  if (
    !isUuid(id) ||
    !isUuid(fields.responsibleAccountId) ||
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 1
  )
    return { ok: false, error: "La actividad o su responsable no son válidos." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("replan_activity_v2", {
    p_activity_id: id,
    p_expected_version: expectedVersion,
    p_responsible_id: fields.responsibleAccountId,
    p_type: fields.type,
    p_title: fields.title,
    p_description: fields.description,
    p_place: fields.placeName,
    p_spans: fields.spans,
  });
  if (error || !data?.[0]) return { ok: false, error: errorMessage(error ?? {}) };
  return refreshActivity(data[0].activity_id);
}

export async function updateSupabaseExecutionAction(
  id: string,
  expectedVersion: number,
  fields: Pick<ActivityDraftFields, "materialLink" | "notes">,
): Promise<ActivityServerResult> {
  const role = await currentActiveSupabaseRole();
  if (role?.id !== "operario")
    return {
      ok: false,
      error: "Solo el operario responsable actualiza la ejecución.",
    };
  const validation = validateExecution(fields);
  if (validation) return { ok: false, error: validation };
  const rawMaterialLink = fields.materialLink.trim();
  const materialLink = rawMaterialLink
    ? safeMaterialUrl(rawMaterialLink)
    : "";
  if (materialLink === null)
    return {
      ok: false,
      error: "Usa un enlace HTTPS válido sin credenciales incrustadas.",
    };
  if (!isUuid(id) || !Number.isInteger(expectedVersion) || expectedVersion < 1)
    return { ok: false, error: "La versión de la actividad no es válida." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("update_execution_v1", {
    p_activity_id: id,
    p_expected_version: expectedVersion,
    p_material_link: materialLink,
    p_operator_opinion: fields.notes.trim(),
  });
  if (error || !data?.[0]) return { ok: false, error: errorMessage(error ?? {}) };
  return refreshActivity(data[0].activity_id);
}

export async function advanceSupabaseActivityAction(
  id: string,
  expectedVersion: number,
): Promise<ActivityServerResult> {
  const role = await currentActiveSupabaseRole();
  if (role?.id !== "operario")
    return {
      ok: false,
      error: "Solo el operario responsable cambia el estado.",
    };
  if (!isUuid(id) || !Number.isInteger(expectedVersion) || expectedVersion < 1)
    return { ok: false, error: "La versión de la actividad no es válida." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("advance_activity_v1", {
    p_activity_id: id,
    p_expected_version: expectedVersion,
  });
  if (error || !data?.[0]) return { ok: false, error: errorMessage(error ?? {}) };
  return refreshActivity(data[0].activity_id);
}

export async function resetSupabaseActivityAction(id: string, expectedVersion: number, reason: string): Promise<ActivityServerResult> {
  const role = await currentActiveSupabaseRole();
  if (role?.id !== "admin") return { ok: false, error: "Solo Admin puede restablecer una actividad." };
  if (!isUuid(id) || !isPositiveVersion(expectedVersion) || typeof reason !== "string" || reason.trim().length < 2 || reason.trim().length > 1000)
    return { ok: false, error: "Indica un motivo de 2 a 1000 caracteres." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("reset_activity_v1", { p_activity_id: id, p_expected_version: expectedVersion, p_reason: reason.trim() });
  if (error || !data?.[0]) return { ok: false, error: error?.code === "PGRST202" ? "El restablecimiento aún no está habilitado en el servidor." : errorMessage(error ?? {}) };
  revalidatePath("/historico");
  revalidatePath("/aunor");
  return refreshActivity(id);
}

export async function postSupabaseActivityMessageAction(
  id: string,
  expectedActivityVersion: number | null,
  text: string,
): Promise<ActivityServerResult> {
  if (!(await canUseInternalConversation()))
    return { ok: false, error: "No tienes acceso a esta conversación." };
  const body = normalizedMessageBody(text);
  if (!body)
    return { ok: false, error: "Escribe un mensaje de hasta 5000 caracteres." };
  if (
    !isUuid(id) ||
    (expectedActivityVersion !== null &&
      !isPositiveVersion(expectedActivityVersion))
  )
    return { ok: false, error: "La conversación no contiene una versión válida." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("post_activity_message_v1", {
    p_activity_id: id,
    p_expected_activity_version: expectedActivityVersion,
    p_body: body,
  });
  if (error || !data?.[0])
    return { ok: false, error: conversationErrorMessage(error ?? {}) };
  return refreshActivity(data[0].activity_id);
}

export async function editSupabaseActivityMessageAction(
  messageId: string,
  expectedMessageVersion: number,
  text: string,
): Promise<ActivityServerResult> {
  if (!(await canUseInternalConversation()))
    return { ok: false, error: "No tienes acceso a esta conversación." };
  const body = normalizedMessageBody(text);
  if (!body)
    return { ok: false, error: "Escribe un mensaje de hasta 5000 caracteres." };
  if (!isUuid(messageId) || !isPositiveVersion(expectedMessageVersion))
    return { ok: false, error: "El mensaje no contiene una versión válida." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("edit_activity_message_v1", {
    p_message_id: messageId,
    p_expected_message_version: expectedMessageVersion,
    p_body: body,
  });
  if (error || !data?.[0])
    return { ok: false, error: conversationErrorMessage(error ?? {}) };
  return refreshActivity(data[0].activity_id);
}

export async function deleteSupabaseActivityMessageAction(
  messageId: string,
  expectedMessageVersion: number,
): Promise<ActivityServerResult> {
  if (!(await canUseInternalConversation()))
    return { ok: false, error: "No tienes acceso a esta conversación." };
  if (!isUuid(messageId) || !isPositiveVersion(expectedMessageVersion))
    return { ok: false, error: "El mensaje no contiene una versión válida." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("delete_activity_message_v1", {
    p_message_id: messageId,
    p_expected_message_version: expectedMessageVersion,
  });
  if (error || !data?.[0])
    return { ok: false, error: conversationErrorMessage(error ?? {}) };
  return refreshActivity(data[0].activity_id);
}
