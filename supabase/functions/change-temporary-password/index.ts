import { withSupabase } from "npm:@supabase/server@1.4.1";
import {
  isRecord,
  passwordPolicyError,
  response,
} from "../_shared/account-validation.ts";
import type { EdgeDatabase } from "../_shared/database.types.ts";
import {
  fingerprintsEqual,
  temporaryPasswordFingerprint,
  temporaryPasswordFingerprintKey,
  temporaryPasswordSaltKey,
  withoutTemporaryPasswordFingerprint,
} from "../_shared/temporary-password.ts";

export async function handleTemporaryPasswordChange(
  request: Request,
  ctx: any,
) {
  if (request.method !== "POST") {
    return response({ ok: false, code: "method_not_allowed" }, 405);
  }

  const callerId = ctx.userClaims?.id;
  const callerEmail = ctx.userClaims?.email;
  if (typeof callerId !== "string") {
    return response({ ok: false, code: "authentication_required" }, 401);
  }

  const { data: profile, error: profileError } = await ctx.supabase
    .from("profiles")
    .select("id, is_active, must_change_password")
    .eq("id", callerId)
    .maybeSingle();
  if (
    profileError ||
    !profile?.is_active ||
    !profile.must_change_password
  ) {
    return response({ ok: false, code: "change_not_pending" }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response({ ok: false, code: "invalid_json" }, 400);
  }
  if (!isRecord(body)) {
    return response({ ok: false, code: "invalid_request" }, 400);
  }
  const password = typeof body.password === "string" ? body.password : "";
  const passwordError = passwordPolicyError(password);
  if (passwordError) {
    return response(
      { ok: false, code: "invalid_password", message: passwordError },
      400,
    );
  }

  const expectedFingerprint = ctx.userClaims?.appMetadata
    ?.[temporaryPasswordFingerprintKey];
  const fingerprintSalt = ctx.userClaims?.appMetadata
    ?.[temporaryPasswordSaltKey];
  if (
    typeof callerEmail !== "string" ||
    typeof expectedFingerprint !== "string" ||
    typeof fingerprintSalt !== "string"
  ) {
    return response(
      {
        ok: false,
        code: "temporary_fingerprint_unavailable",
        message: "Admin debe regenerar la clave temporal antes de continuar.",
      },
      409,
    );
  }
  let candidateFingerprint: string;
  try {
    candidateFingerprint = await temporaryPasswordFingerprint(
      callerEmail,
      password,
      fingerprintSalt,
    );
  } catch {
    return response(
      {
        ok: false,
        code: "temporary_fingerprint_unavailable",
        message: "Admin debe regenerar la clave temporal antes de continuar.",
      },
      409,
    );
  }
  if (fingerprintsEqual(candidateFingerprint, expectedFingerprint)) {
    return response(
      {
        ok: false,
        code: "same_password",
        message: "La nueva clave debe ser diferente de la clave temporal.",
      },
      400,
    );
  }

  const { error: authError } = await ctx.supabaseAdmin.auth.admin
    .updateUserById(callerId, { password });
  if (authError) {
    return response({ ok: false, code: "auth_update_failed" }, 409);
  }

  const { error: finalizeError } = await ctx.supabaseAdmin.rpc(
    "complete_temporary_password_change_v1",
    { p_profile_id: callerId },
  );
  if (finalizeError) {
    return response(
      {
        ok: false,
        code: "finalize_failed",
        message:
          "La clave cambió, pero el acceso sigue bloqueado. Ingresa con la clave nueva y reintenta.",
      },
      409,
    );
  }

  let fingerprintCleanupPending = false;
  const { data: authAccount, error: authAccountError } = await ctx
    .supabaseAdmin.auth.admin.getUserById(callerId);
  if (authAccountError || !authAccount.user) {
    fingerprintCleanupPending = true;
  } else {
    const { error: cleanupError } = await ctx.supabaseAdmin.auth.admin
      .updateUserById(callerId, {
        app_metadata: withoutTemporaryPasswordFingerprint(
          authAccount.user.app_metadata,
        ),
      });
    fingerprintCleanupPending = Boolean(cleanupError);
  }

  return response({ ok: true, fingerprintCleanupPending });
}

export default {
  fetch: withSupabase<EdgeDatabase>(
    { auth: "user" },
    handleTemporaryPasswordChange,
  ),
};
