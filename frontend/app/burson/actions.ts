"use server";

import { revalidatePath } from "next/cache";
import type { ActivityDraftFields } from "@/lib/activity-draft";
import { activityPlanningError } from "@/lib/activity-validation";
import type { BursonRequestView } from "@/lib/burson";
import { safeReferenceUrl } from "@/lib/external-link";
import { getSupabaseBursonRequest } from "@/lib/supabase/activities";
import { currentSupabaseRole } from "@/lib/supabase/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

export type BursonRequestServerResult =
  | { ok: true; request: BursonRequestView; replayed: boolean }
  | { ok: false; error: string };

function bursonErrorMessage(error: { code?: string }) {
  const messages: Record<string, string> = {
    PGRST202: "Falta actualizar el servidor para guardar lugares por jornada. No se guardaron cambios.",
    SR002: "Tu cuenta no puede crear encargos Burson.",
    SR003: "Completa el encargo con datos y fechas válidas.",
    SR006:
      "La misma solicitud ya se utilizó con datos diferentes. Recarga el formulario.",
    SR009:
      "No hay un Operario especial activo. Solicita a Admin que configure el vínculo Burson.",
  };
  return messages[error.code ?? ""] ?? "No se pudo crear el encargo Burson.";
}

export async function createSupabaseBursonRequestAction(
  fields: ActivityDraftFields,
  idempotencyKey: string,
): Promise<BursonRequestServerResult> {
  const role = await currentSupabaseRole();
  if (
    role?.id !== "burson" ||
    !role.createsBursonRequests ||
    role.mustChangePassword
  )
    return { ok: false, error: "Solo Burson puede crear sus encargos." };

  const validation = activityPlanningError(fields);
  if (validation) return { ok: false, error: validation };
  if (!isUuid(idempotencyKey))
    return { ok: false, error: "La solicitud no contiene una clave válida." };
  if (typeof fields.referenceLink !== "string")
    return { ok: false, error: "El enlace de referencia no es válido." };

  const rawReferenceLink = fields.referenceLink.trim();
  const normalizedReferenceLink = rawReferenceLink
    ? safeReferenceUrl(rawReferenceLink)
    : "";
  if (rawReferenceLink.length > 2048 || normalizedReferenceLink === null)
    return {
      ok: false,
      error: "Usa un enlace de referencia HTTPS válido y sin credenciales.",
    };
  const referenceLink = normalizedReferenceLink;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_burson_request_v2", {
    p_idempotency_key: idempotencyKey,
    p_type: fields.type,
    p_title: fields.title,
    p_description: fields.description,
    p_place: fields.placeName,
    p_spans: fields.spans,
    p_reference_link: referenceLink,
  });
  if (error || !data?.[0])
    return { ok: false, error: bursonErrorMessage(error ?? {}) };

  const request = await getSupabaseBursonRequest(data[0].activity_id);
  if (!request)
    return {
      ok: false,
      error: "El encargo se creó, pero no pudo volver a leerse con esta sesión.",
    };

  revalidatePath("/burson");
  revalidatePath(`/burson/${request.id}`);
  return { ok: true, request, replayed: data[0].replayed };
}
