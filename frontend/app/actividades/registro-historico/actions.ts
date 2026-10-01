"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { currentRole } from "@/lib/session";
import { resolveDataSource } from "@/lib/data-source";
import { isUuid } from "@/lib/uuid";
import {
  historicalRegistrationError,
  type HistoricalRegistration,
} from "@/lib/historical-registration";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registerDemoHistorical } from "@/lib/aunor-demo.server";
import { accountsCookieName, parseAccounts } from "@/lib/accounts";
import type { Json } from "@/lib/supabase/database.types";

export async function registerHistoricalAction(
  input: HistoricalRegistration,
  requestId: string,
) {
  const role = await currentRole();
  if (role?.id !== "admin" || role.mustChangePassword)
    return {
      ok: false as const,
      error: "Solo Admin puede registrar trabajos históricos.",
    };
  const validation = historicalRegistrationError(input);
  if (validation) return { ok: false as const, error: validation };
  if (!isUuid(requestId))
    return { ok: false as const, error: "Solicitud no válida." };
  try {
    let activityId: string;
    let activity;
    if (resolveDataSource() === "supabase") {
      if (!isUuid(input.responsibleAccountId))
        return { ok: false as const, error: "Responsable no válido." };
      const db = await createSupabaseServerClient();
      const { data, error } = await db.rpc("register_historical_activity_v1", {
        p_request_id: requestId,
        p_payload: input as unknown as Json,
      });
      if (
        error &&
        !/^(SR\d{3}|(?:22|23|42|P0)[A-Z0-9]{3}|PGRST202)$/.test(
          error.code ?? "",
        )
      )
        return {
          ok: false as const,
          uncertain: true,
          error:
            "No se pudo confirmar el registro. Reintenta sin cambiar el formulario para evitar duplicados.",
        };
      if (error)
        return {
          ok: false as const,
          error:
            error.code === "SR006"
              ? "El reintento no coincide con el registro original. Revisa la ficha antes de crear otro."
              : error.code === "PGRST202"
                ? "El registro histórico aún no está habilitado en el servidor."
                : "No se registró el trabajo. Revisa responsable, fecha, material y servicio.",
        };
      const id = (data as { activityId?: string } | null)?.activityId;
      if (!id)
        return {
          ok: false as const,
          uncertain: true,
          error:
            "No se pudo confirmar el registro. Conserva el formulario y reintenta sin cambiarlo.",
        };
      activityId = id;
    } else {
      const operator = parseAccounts(
        (await cookies()).get(accountsCookieName)?.value ?? null,
      ).find(
        (a) =>
          a.id === input.responsibleAccountId &&
          a.active &&
          a.roleId === "operario",
      );
      if (!operator)
        return { ok: false as const, error: "Selecciona un operario activo." };
      activity = registerDemoHistorical(role, input, requestId, operator.name);
      activityId = activity.id;
    }
    // No follow-up data read can turn a committed write into a reported failure.
    revalidatePath("/actividades");
    revalidatePath("/historico");
    revalidatePath("/contrato");
    revalidatePath("/aunor", "layout");
    return { ok: true as const, activityId, activity };
  } catch {
    return {
      ok: false as const,
      uncertain: true,
      error:
        "No se pudo confirmar el registro. Reintenta sin cambiar el formulario para evitar duplicados.",
    };
  }
}
