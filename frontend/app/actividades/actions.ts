"use server";

import { revalidatePath } from "next/cache";
import { activityTypes } from "@/lib/activities";
import {
  type ActivityDraftFields,
} from "@/lib/activity-draft";
import { validSpans } from "@/lib/activity-validation";
import { safeMaterialUrl } from "@/lib/external-link";
import type { SimulatedActivity } from "@/lib/activity-simulation";
import {
  getSupabaseActivity,
} from "@/lib/supabase/activities";
import { currentSupabaseRole } from "@/lib/supabase/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

export type ActivityServerResult =
  | { ok: true; activity: SimulatedActivity; replayed?: boolean }
  | { ok: false; error: string };

function validateFields(fields: ActivityDraftFields) {
  if (
    !fields ||
    typeof fields.title !== "string" ||
    typeof fields.description !== "string" ||
    typeof fields.placeName !== "string" ||
    typeof fields.materialLink !== "string" ||
    typeof fields.notes !== "string" ||
    typeof fields.referenceLink !== "string" ||
    !activityTypes.includes(fields.type) ||
    !fields.title.trim() ||
    !fields.description.trim() ||
    !validSpans(fields.spans)
  ) {
    return "Completa título, descripción y fechas válidas.";
  }
  if (fields.materialLink && !safeMaterialUrl(fields.materialLink)) {
    return "Usa un enlace HTTPS válido sin credenciales incrustadas.";
  }
  if (fields.placeName.length > 300 || fields.notes.length > 5000) {
    return "Uno de los campos supera el tamaño permitido.";
  }
  return null;
}

function normalizedMaterialLink(fields: ActivityDraftFields) {
  const value = fields.materialLink.trim();
  return value ? safeMaterialUrl(value) : "";
}

function errorMessage(error: { code?: string; message?: string }) {
  const messages: Record<string, string> = {
    SR001: "La actividad cambió; recarga antes de guardar.",
    SR002: "No tienes permiso para realizar esta acción.",
    SR003: "Completa los datos obligatorios con valores válidos.",
    SR004: "La actividad ya fue entregada.",
    SR005: "Añade un enlace HTTPS válido antes de entregar.",
    SR006: "La misma solicitud ya se usó con datos diferentes. Recarga el formulario.",
  };
  return messages[error.code ?? ""] ?? "No se pudo completar la operación.";
}

async function requireOperator() {
  const role = await currentSupabaseRole();
  return role?.id === "operario" ? role : null;
}

async function refreshActivity(id: string): Promise<ActivityServerResult> {
  const activity = await getSupabaseActivity(id);
  if (!activity) return { ok: false, error: "La actividad no existe." };
  revalidatePath("/actividades");
  revalidatePath(`/actividades/${id}`);
  return { ok: true, activity };
}

export async function createSupabaseActivityAction(
  fields: ActivityDraftFields,
  idempotencyKey: string,
): Promise<ActivityServerResult> {
  if (!(await requireOperator())) {
    return { ok: false, error: "Solo un operario activo puede registrar actividades." };
  }
  const validation = validateFields(fields);
  if (validation) return { ok: false, error: validation };
  const materialLink = normalizedMaterialLink(fields);
  if (materialLink === null) return { ok: false, error: "El enlace no es válido." };
  if (!isUuid(idempotencyKey)) {
    return { ok: false, error: "La solicitud no contiene una clave idempotente válida." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_activity_v1", {
    p_idempotency_key: idempotencyKey,
    p_type: fields.type,
    p_title: fields.title,
    p_description: fields.description,
    p_place: fields.placeName,
    p_spans: fields.spans,
    p_material_link: materialLink,
    p_operator_opinion: fields.notes,
  });
  if (error || !data?.[0]) return { ok: false, error: errorMessage(error ?? {}) };
  const result = await refreshActivity(data[0].activity_id);
  return result.ok ? { ...result, replayed: data[0].replayed } : result;
}

export async function editSupabaseActivityAction(
  id: string,
  expectedVersion: number,
  fields: ActivityDraftFields,
): Promise<ActivityServerResult> {
  if (!(await requireOperator())) {
    return { ok: false, error: "Solo el operario responsable puede editar." };
  }
  const validation = validateFields(fields);
  if (validation) return { ok: false, error: validation };
  if (!isUuid(id) || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { ok: false, error: "La versión de la actividad no es válida." };
  }
  const materialLink = normalizedMaterialLink(fields);
  if (materialLink === null) return { ok: false, error: "El enlace no es válido." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("edit_activity_v1", {
    p_activity_id: id,
    p_expected_version: expectedVersion,
    p_type: fields.type,
    p_title: fields.title,
    p_description: fields.description,
    p_place: fields.placeName,
    p_spans: fields.spans,
    p_material_link: materialLink,
    p_operator_opinion: fields.notes,
  });
  if (error || !data?.[0]) return { ok: false, error: errorMessage(error ?? {}) };
  return refreshActivity(data[0].activity_id);
}

export async function advanceSupabaseActivityAction(
  id: string,
  expectedVersion: number,
): Promise<ActivityServerResult> {
  if (!(await requireOperator())) {
    return { ok: false, error: "Solo el operario responsable cambia el estado." };
  }
  if (!isUuid(id) || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { ok: false, error: "La versión de la actividad no es válida." };
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("advance_activity_v1", {
    p_activity_id: id,
    p_expected_version: expectedVersion,
  });
  if (error || !data?.[0]) return { ok: false, error: errorMessage(error ?? {}) };
  return refreshActivity(data[0].activity_id);
}
