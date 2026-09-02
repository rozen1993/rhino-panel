"use server";

import { revalidatePath } from "next/cache";
import { currentSupabaseRole } from "@/lib/supabase/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

export type TrashServerResult =
  | { ok: true }
  | { ok: false; error: string };

function isPositiveVersion(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function trashError(error: { code?: string; message?: string }) {
  if (
    error.code === "SR009" &&
    error.message?.includes("restore requires an active responsible")
  )
    return "El responsable ya no está activo. Elige un Operario activo para restaurar.";
  if (
    error.code === "SR009" &&
    error.message?.includes(
      "delivered activity keeps its historical responsible",
    )
  )
    return "Una actividad entregada debe conservar a su responsable histórico.";
  const messages: Record<string, string> = {
    "40P01":
      "La operación coincidió con otro cambio. Inténtalo nuevamente.",
    SR001: "La actividad cambió; recarga antes de continuar.",
    SR002: "Solo Admin puede administrar la Papelera.",
    SR003: "Revisa el motivo o el Operario seleccionado.",
    SR009: "La restauración necesita una asignación válida.",
    SR010: "La actividad ya cambió de estado en la Papelera.",
  };
  return messages[error.code ?? ""] ?? "No se pudo completar la operación.";
}

async function requireAdmin() {
  const role = await currentSupabaseRole();
  return role?.id === "admin" && !role.mustChangePassword;
}

function revalidateActivitySurfaces(id: string) {
  revalidatePath("/papelera");
  revalidatePath("/actividades");
  revalidatePath(`/actividades/${id}`);
  revalidatePath("/historico");
  revalidatePath("/burson");
  revalidatePath(`/burson/${id}`);
}

export async function softDeleteSupabaseActivityAction(
  id: string,
  expectedVersion: number,
  reason: string,
): Promise<TrashServerResult> {
  if (!(await requireAdmin()))
    return { ok: false, error: "Solo Admin puede dar de baja actividades." };
  const normalizedReason = typeof reason === "string" ? reason.trim() : "";
  if (
    !isUuid(id) ||
    !isPositiveVersion(expectedVersion) ||
    normalizedReason.length < 2 ||
    normalizedReason.length > 1000
  )
    return {
      ok: false,
      error: "Escribe un motivo de baja de 2 a 1000 caracteres.",
    };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("soft_delete_activity_v1", {
    p_activity_id: id,
    p_expected_version: expectedVersion,
    p_reason: normalizedReason,
  });
  if (error || !data?.[0])
    return { ok: false, error: trashError(error ?? {}) };
  revalidateActivitySurfaces(id);
  return { ok: true };
}

export async function restoreSupabaseActivityAction(
  id: string,
  expectedVersion: number,
  responsibleAccountId: string | null,
): Promise<TrashServerResult> {
  if (!(await requireAdmin()))
    return { ok: false, error: "Solo Admin puede restaurar actividades." };
  if (
    !isUuid(id) ||
    !isPositiveVersion(expectedVersion) ||
    (responsibleAccountId !== null && !isUuid(responsibleAccountId))
  )
    return { ok: false, error: "La restauración solicitada no es válida." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("restore_activity_v1", {
    p_activity_id: id,
    p_expected_version: expectedVersion,
    p_responsible_id: responsibleAccountId,
  });
  if (error || !data?.[0])
    return { ok: false, error: trashError(error ?? {}) };
  revalidateActivitySurfaces(id);
  return { ok: true };
}
