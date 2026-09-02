"use server";

import { revalidatePath } from "next/cache";
import type { Account, AccountFields } from "@/lib/accounts";
import { passwordPolicyError } from "@/lib/password-policy";
import { roleIds } from "@/lib/roles";
import { functionErrorMessage } from "@/lib/supabase/function-error";
import { listSupabaseAccounts } from "@/lib/supabase/profiles";
import { currentSupabaseRole } from "@/lib/supabase/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

export type AccountsServerResult =
  | { ok: true; accounts: Account[] }
  | { ok: false; error: string };

function validFields(fields: unknown, creating = false): fields is AccountFields {
  if (!fields || typeof fields !== "object") return false;
  const value = fields as Partial<AccountFields>;
  return (
    typeof value.name === "string" &&
    value.name.trim().length >= 2 &&
    value.name.trim().length <= 120 &&
    typeof value.username === "string" &&
    /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(
      value.username.trim().toLowerCase(),
    ) &&
    typeof value.password === "string" &&
    (!creating || !passwordPolicyError(value.password)) &&
    roleIds.includes(value.roleId!) &&
    typeof value.bursonLinked === "boolean" &&
    typeof value.canCreateOwnActivities === "boolean" &&
    (value.roleId === "operario" ||
      (!value.bursonLinked && !value.canCreateOwnActivities))
  );
}

function accountError(code?: string, detail?: string) {
  if (code === "40P01")
    return "Otra operación de cuentas está en curso; vuelve a intentarlo.";
  if (
    code === "SR009" &&
    detail?.includes("transfer the Burson link before changing this operator")
  )
    return "Transfiere primero el vínculo Burson a otro Operario activo.";
  if (code === "SR009" && detail?.includes("Burson link requires an active"))
    return "Reactiva primero al Operario antes de vincularlo a Burson.";
  if (
    code === "SR009" &&
    detail?.includes("reassign open activities before deactivating operator")
  )
    return "Reasigna primero las actividades abiertas de este Operario.";
  const messages: Record<string, string> = {
    SR001: "La cuenta cambió; recarga antes de guardar.",
    SR002: "Solo Admin puede realizar esta operación.",
    SR003: "Revisa los datos obligatorios de la cuenta.",
    SR006: "El usuario ya existe.",
    SR009: "La operación rompería una cuenta o vínculo obligatorio.",
  };
  return messages[code ?? ""] ?? "No se pudo completar la operación.";
}

async function requireAdmin() {
  const role = await currentSupabaseRole();
  return role?.id === "admin" && !role.mustChangePassword;
}

async function refreshed(): Promise<AccountsServerResult> {
  revalidatePath("/cuentas");
  return { ok: true, accounts: await listSupabaseAccounts() };
}

const createFunctionErrors: Record<string, string> = {
  server_configuration:
    "La configuración del dominio interno no es válida. Revisa el entorno.",
  account_exists: "Ese usuario ya existe.",
  auth_create_failed: "Auth no pudo crear la cuenta o el usuario ya existe.",
  auth_lookup_failed: "Auth no pudo comprobar si el usuario ya existe.",
  auth_repair_failed: "No se pudo recuperar el usuario pendiente; reintenta.",
  profile_lookup_failed: "No se pudo comprobar el perfil de la cuenta.",
  profile_create_failed: "No se creó el perfil; el usuario Auth fue retirado.",
  profile_create_cleanup_pending:
    "No se creó el perfil y la limpieza quedó pendiente; reintenta el mismo usuario.",
};

const resetFunctionErrors: Record<string, string> = {
  auth_account_not_found: "La cuenta no existe en Auth.",
  reset_prepare_failed:
    "No se inició el restablecimiento. Verifica que la cuenta esté activa.",
  auth_reset_failed:
    "La cuenta quedó bloqueada, pero Auth no cambió la clave. Genera otra.",
  reset_confirm_failed:
    "Auth sí cambió esta clave, pero la auditoría no se confirmó. No la entregues: genera otra.",
};

export async function createSupabaseAccountAction(
  fields: AccountFields,
): Promise<AccountsServerResult> {
  if (!(await requireAdmin()))
    return { ok: false, error: "Solo Admin puede crear cuentas." };
  if (!validFields(fields, true))
    return { ok: false, error: "Revisa los datos y la clave temporal." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.functions.invoke("admin-accounts", {
    body: {
      action: "create",
      username: fields.username.trim().toLowerCase(),
      displayName: fields.name.trim(),
      role: fields.roleId,
      isBursonOperator: fields.bursonLinked,
      canCreateOwnActivities: fields.canCreateOwnActivities,
      temporaryPassword: fields.password,
    },
  });
  if (error)
    return {
      ok: false,
      error: await functionErrorMessage(
        error,
        createFunctionErrors,
        "No se pudo crear la cuenta.",
      ),
    };
  return refreshed();
}

export async function updateSupabaseAccountAction(
  id: string,
  expectedUpdatedAt: string,
  fields: AccountFields,
  active: boolean,
): Promise<AccountsServerResult> {
  if (!(await requireAdmin()))
    return { ok: false, error: "Solo Admin puede editar cuentas." };
  if (
    !isUuid(id) ||
    Number.isNaN(Date.parse(expectedUpdatedAt)) ||
    typeof active !== "boolean" ||
    !validFields({ ...fields, password: fields.password ?? "" })
  )
    return { ok: false, error: "Los datos de la cuenta no son válidos." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_account_v1", {
    p_profile_id: id,
    p_expected_updated_at: expectedUpdatedAt,
    p_display_name: fields.name.trim(),
    p_role: fields.roleId,
    p_is_active: active,
    p_is_burson_operator: fields.bursonLinked,
    p_can_create_own_activities: fields.canCreateOwnActivities,
  });
  if (error)
    return { ok: false, error: accountError(error.code, error.message) };
  return refreshed();
}

export async function setSupabaseOperatorCreationPermissionAction(
  id: string,
  enabled: boolean,
): Promise<AccountsServerResult> {
  if (!(await requireAdmin()))
    return { ok: false, error: "Solo Admin puede cambiar este permiso." };
  if (!isUuid(id) || typeof enabled !== "boolean")
    return { ok: false, error: "El permiso solicitado no es válido." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "set_operator_creation_permission_v1",
    { p_operator_id: id, p_enabled: enabled },
  );
  if (error)
    return { ok: false, error: accountError(error.code, error.message) };
  return refreshed();
}

export async function resetSupabaseTemporaryPasswordAction(
  id: string,
  temporaryPassword: string,
): Promise<AccountsServerResult> {
  if (!(await requireAdmin()))
    return { ok: false, error: "Solo Admin puede regenerar claves." };
  const validation = passwordPolicyError(temporaryPassword);
  if (!isUuid(id) || validation)
    return { ok: false, error: validation ?? "La cuenta no es válida." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.functions.invoke("admin-accounts", {
    body: {
      action: "reset-password",
      profileId: id,
      temporaryPassword,
    },
  });
  if (error)
    return {
      ok: false,
      error: await functionErrorMessage(
        error,
        resetFunctionErrors,
        "No se pudo completar el restablecimiento. No entregues la clave mostrada.",
      ),
    };
  return refreshed();
}
