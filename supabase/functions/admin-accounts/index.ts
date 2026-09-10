import { withSupabase } from "npm:@supabase/server@1.4.1";
import {
  isRecord,
  normalizeUsername,
  passwordPolicyError,
  response,
  validDisplayName,
  validRole,
  validUsernameDomain,
} from "../_shared/account-validation.ts";
import type { EdgeDatabase } from "../_shared/database.types.ts";
import { credentialOperation } from "../_shared/credential-operation.ts";
import {
  createTemporaryPasswordSalt,
  metadataRecord,
  sistemaRUsernameKey,
  temporaryPasswordFingerprint,
  temporaryPasswordFingerprintKey,
  temporaryPasswordSaltKey,
} from "../_shared/temporary-password.ts";

async function requireAdministrator(ctx: any) {
  const callerId = ctx.userClaims?.id;
  if (typeof callerId !== "string") return null;
  const { data, error } = await ctx.supabase
    .from("profiles")
    .select("id, role, is_active, must_change_password")
    .eq("id", callerId)
    .maybeSingle();
  if (
    error ||
    !data ||
    data.role !== "admin" ||
    !data.is_active ||
    data.must_change_password
  ) {
    return null;
  }
  return callerId;
}

function usernameEmail(username: string) {
  const domain = Deno.env.get("SISTEMA_R_USERNAME_DOMAIN")
    ?.trim()
    .toLowerCase();
  if (!domain || !validUsernameDomain(domain)) {
    throw new Error("invalid username domain configuration");
  }
  return `${username}@${domain}`;
}

async function findAuthUserByEmail(ctx: any, email: string) {
  const perPage = 1000;
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await ctx.supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) return { user: null, error };
    const user = data.users.find(
      (candidate: { email?: string }) =>
        candidate.email?.toLowerCase() === email.toLowerCase(),
    );
    if (user) return { user, error: null };
    if (data.users.length < perPage) return { user: null, error: null };
  }
  return {
    user: null,
    error: new Error("Auth user lookup exceeded its safe page limit"),
  };
}

async function authMetadata(
  email: string,
  username: string,
  temporaryPassword: string,
  current: unknown = {},
) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) {
    throw new Error("invalid username metadata");
  }
  const salt = createTemporaryPasswordSalt();
  return {
    ...metadataRecord(current),
    [sistemaRUsernameKey]: normalizedUsername,
    [temporaryPasswordFingerprintKey]: await temporaryPasswordFingerprint(
      email,
      temporaryPassword,
      salt,
    ),
    [temporaryPasswordSaltKey]: salt,
  };
}

export async function handleAdminAccountsRequest(request: Request, ctx: any) {
  if (request.method === "POST") {
    const body = await request.clone().json().catch(() => null);
    if (body?.action === "reset-password" && typeof body.profileId === "string") {
      const actor = await requireAdministrator(ctx);
      if (!actor) return response({ ok: false, code: "administrator_required" }, 403);
      if (body.profileId === actor) return response({ ok: false, code: "self_reset_not_allowed" }, 409);
      return credentialOperation(ctx, body.profileId, actor, () => handleAdminAccountsCore(request, ctx));
    }
  }
  return handleAdminAccountsCore(request, ctx);
}

async function handleAdminAccountsCore(request: Request, ctx: any) {
  if (request.method !== "POST") {
    return response({ ok: false, code: "method_not_allowed" }, 405);
  }

  const actorId = await requireAdministrator(ctx);
  if (!actorId) {
    return response({ ok: false, code: "administrator_required" }, 403);
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
  if (body.action !== "create" && body.action !== "reset-password") {
    return response({ ok: false, code: "unsupported_action" }, 400);
  }

  const temporaryPassword = typeof body.temporaryPassword === "string"
    ? body.temporaryPassword
    : "";
  const passwordError = passwordPolicyError(temporaryPassword);
  if (passwordError) {
    return response(
      { ok: false, code: "invalid_password", message: passwordError },
      400,
    );
  }

  if (body.action === "create") {
    const username = normalizeUsername(body.username);
    if (
      !username ||
      !validDisplayName(body.displayName) ||
      !validRole(body.role) ||
      body.isBursonOperator !== false ||
      typeof body.canCreateOwnActivities !== "boolean" ||
      (body.role !== "operario" && body.isBursonOperator) ||
      (body.role !== "operario" && body.canCreateOwnActivities)
    ) {
      return response({ ok: false, code: "invalid_account" }, 400);
    }

    let email: string;
    try {
      email = usernameEmail(username);
    } catch {
      return response({ ok: false, code: "server_configuration" }, 500);
    }

    const provisioningMetadata = await authMetadata(
      email,
      username,
      temporaryPassword,
    );
    let { data: created, error: authError } = await ctx.supabaseAdmin.auth
      .admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        app_metadata: provisioningMetadata,
      });

    if (authError || !created.user) {
      const lookup = await findAuthUserByEmail(ctx, email);
      if (lookup.error) {
        return response({ ok: false, code: "auth_lookup_failed" }, 503);
      }
      if (!lookup.user) {
        return response({ ok: false, code: "auth_create_failed" }, 409);
      }

      const { data: existingProfile, error: profileLookupError } = await ctx
        .supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", lookup.user.id)
        .maybeSingle();
      if (profileLookupError) {
        return response({ ok: false, code: "profile_lookup_failed" }, 503);
      }
      if (existingProfile) {
        return response({ ok: false, code: "account_exists" }, 409);
      }

      const { data: repaired, error: repairError } = await ctx.supabaseAdmin
        .auth.admin.updateUserById(lookup.user.id, {
          password: temporaryPassword,
          email_confirm: true,
          app_metadata: await authMetadata(
            email,
            username,
            temporaryPassword,
            lookup.user.app_metadata,
          ),
        });
      if (repairError || !repaired.user) {
        return response({ ok: false, code: "auth_repair_failed" }, 409);
      }
      created = repaired;
      authError = null;
    }

    const { error: profileError } = await ctx.supabaseAdmin.rpc(
      "create_account_profile_v1",
      {
        p_profile_id: created.user.id,
        p_username: username,
        p_display_name: body.displayName.trim(),
        p_role: body.role,
        p_is_burson_operator: body.isBursonOperator,
        p_can_create_own_activities: body.canCreateOwnActivities,
        p_actor_id: actorId,
      },
    );
    if (profileError) {
      const { error: cleanupError } = await ctx.supabaseAdmin.auth.admin
        .deleteUser(created.user.id);
      return response(
        {
          ok: false,
          code: cleanupError
            ? "profile_create_cleanup_pending"
            : body.role === "aunor" && profileError.code === "SR009"
            ? "aunor_account_exists"
            : "profile_create_failed",
        },
        409,
      );
    }

    return response({ ok: true, profileId: created.user.id }, 201);
  }

  if (body.action === "reset-password") {
    if (typeof body.profileId !== "string") {
      return response({ ok: false, code: "invalid_account" }, 400);
    }

    const { data: targetAuth, error: targetAuthError } = await ctx
      .supabaseAdmin.auth.admin.getUserById(body.profileId);
    if (targetAuthError || !targetAuth.user?.email) {
      return response({ ok: false, code: "auth_account_not_found" }, 409);
    }

    const { data: targetProfile, error: targetProfileError } = await ctx
      .supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("id", body.profileId)
      .maybeSingle();
    const targetUsername = normalizeUsername(targetProfile?.username);
    if (targetProfileError || !targetUsername) {
      return response(
        { ok: false, code: "profile_username_unavailable" },
        targetProfileError ? 503 : 409,
      );
    }

    const { error: prepareError } = await ctx.supabaseAdmin.rpc(
      "prepare_temporary_password_reset_v1",
      { p_profile_id: body.profileId, p_actor_id: actorId },
    );
    if (prepareError) {
      return response({ ok: false, code: "reset_prepare_failed" }, 409);
    }

    const { error: authError } = await ctx.supabaseAdmin.auth.admin
      .updateUserById(body.profileId, {
        password: temporaryPassword,
        app_metadata: await authMetadata(
          targetAuth.user.email,
          targetUsername,
          temporaryPassword,
          targetAuth.user.app_metadata,
        ),
      });
    if (authError) {
      return response(
        {
          ok: false,
          code: "auth_reset_failed",
          message:
            "La rotación quedó iniciada y la cuenta bloqueada; vuelve a generar una clave temporal.",
        },
        409,
      );
    }

    const { error: confirmError } = await ctx.supabaseAdmin.rpc(
      "confirm_temporary_password_reset_v1",
      { p_profile_id: body.profileId, p_actor_id: actorId },
    );
    if (confirmError) {
      return response(
        {
          ok: false,
          code: "reset_confirm_failed",
          message:
            "Auth cambió la clave, pero falta confirmar la auditoría; genera otra clave antes de entregarla.",
        },
        409,
      );
    }

    return response({ ok: true, profileId: body.profileId });
  }

  return response({ ok: false, code: "unsupported_action" }, 400);
}

export default {
  fetch: withSupabase<EdgeDatabase>(
    { auth: "user" },
    handleAdminAccountsRequest,
  ),
};
