"use server";

import { cookies } from "next/headers";
import { passwordPolicyError } from "@/lib/password-policy";
import { isSupabaseAuthCookieName } from "@/lib/supabase/cookie-options";
import { functionErrorMessage } from "@/lib/supabase/function-error";
import { currentSupabaseRole } from "@/lib/supabase/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function changeSupabaseTemporaryPasswordAction(
  password: string,
) {
  const role = await currentSupabaseRole();
  const validation = passwordPolicyError(password);
  if (!role?.mustChangePassword)
    return { ok: false as const, error: "No existe un cambio pendiente." };
  if (validation) return { ok: false as const, error: validation };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.functions.invoke<{
    ok: boolean;
    fingerprintCleanupPending?: boolean;
  }>(
    "change-temporary-password",
    { body: { password } },
  );
  if (error)
    return {
      ok: false as const,
      error: await functionErrorMessage(
        error,
        {
          credential_operation_busy: "Hay un cambio de clave en curso. Espera o solicita al administrador revisar la operación pendiente.",
          credential_reconciliation_required: "La operación necesita revisión del administrador antes de reintentarse.",
          same_password:
            "La nueva clave debe ser diferente de la clave temporal.",
          temporary_fingerprint_unavailable:
            "Admin debe regenerar tu clave temporal antes de continuar.",
          auth_update_failed: "No se pudo confirmar el cambio. Solicita revisión antes de reintentarlo.",
          finalize_failed:
            "La clave cambió, pero falta cerrar la operación. Solicita revisión técnica antes de reintentarlo.",
        },
        "No se pudo confirmar el cambio de clave.",
      ),
    };
  if (data?.fingerprintCleanupPending) {
    console.warn(
      "La clave cambió, pero la huella temporal quedó pendiente de limpieza en Auth.",
    );
  }

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // La limpieza manual de cookies mantiene el cierre local aunque Auth falle.
  } finally {
    const store = await cookies();
    for (const cookie of store.getAll()) {
      if (isSupabaseAuthCookieName(cookie.name)) store.delete(cookie.name);
    }
  }
  return { ok: true as const };
}
