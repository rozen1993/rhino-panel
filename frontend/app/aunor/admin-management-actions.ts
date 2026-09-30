"use server";
import { revalidatePath } from "next/cache";
import { currentRole } from "@/lib/session";
import { resolveDataSource } from "@/lib/data-source";
import { isUuid } from "@/lib/uuid";
import {
  validAdminActivityInput,
  type AdminActivityInput,
} from "@/lib/admin-activity-management";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseActivity } from "@/lib/supabase/activities";
import {
  mutateDemoAdminActivity,
  type DemoAunorSource,
} from "@/lib/aunor-demo.server";

export async function saveAdminActivityAction(
  input: AdminActivityInput,
  demoSource?: DemoAunorSource,
) {
  const role = await currentRole();
  if (role?.id !== "admin" || role.mustChangePassword)
    return {
      ok: false as const,
      error: "Solo Admin puede gestionar el contrato y los reemplazos.",
    };
  if (!validAdminActivityInput(input) || !isUuid(input.requestId))
    return { ok: false as const, error: "Revisa los campos antes de guardar." };
  const remote = resolveDataSource() === "supabase";
  if (
    remote &&
    (!isUuid(input.activityId) ||
      (input.command === "relation" &&
        input.periodId !== null &&
        !isUuid(input.periodId)) ||
      (input.command === "replacement" &&
        (!isUuid(input.originalId) ||
          (input.agreementId !== "" && !isUuid(input.agreementId)))))
  )
    return {
      ok: false as const,
      error: "Actividad, periodo o acuerdo no válido.",
    };
  try {
    if (remote) {
      const db = await createSupabaseServerClient();
      const { command, activityId, requestId, ...payload } = input;
      const { error } = await db.rpc("save_admin_activity_bundle_v1", {
        p_command: command,
        p_activity_id: activityId,
        p_request_id: requestId,
        p_payload: payload,
      });
      if (error)
        return {
          ok: false as const,
          error:
            error.code === "SR001"
              ? "La actividad o el acuerdo cambió. Recarga la ficha antes de guardar."
              : error.code === "SR006"
                ? "Este reintento no coincide con la operación original. Recarga la ficha."
                : "No se guardó ningún cambio. Revisa los campos y la disponibilidad de la gestión contractual.",
        };
    } else mutateDemoAdminActivity(role, input, demoSource);
    revalidatePath("/aunor", "layout");
    revalidatePath(`/actividades/${input.activityId}`);
    if (input.command === "replacement")
      revalidatePath(`/actividades/${input.originalId}`);
    return {
      ok: true as const,
      activity: remote
        ? await getSupabaseActivity(input.activityId).catch(() => null)
        : null,
    };
  } catch {
    return {
      ok: false as const,
      error:
        "No se pudo confirmar el guardado. Reintenta sin cambiar los campos; no se duplicará el registro.",
    };
  }
}
