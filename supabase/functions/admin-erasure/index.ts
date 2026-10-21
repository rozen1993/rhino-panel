import { withSupabase } from "npm:@supabase/server@1.4.1";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { response } from "../_shared/account-validation.ts";

// Passwords live only in this request. Never log request bodies or Auth replies.
export async function handleAdminErasure(request: Request, ctx: any) {
  if (request.method !== "POST") return response({ code: "method_not_allowed" },405);
  const body = await request.json().catch(() => null);
  if (!body || !["trash","account"].includes(body.kind) || typeof body.password !== "string" || body.password.length < 1 || body.password.length > 256 || !/^[a-f0-9]{64}$/.test(body.fingerprint ?? "") || body.confirmation !== "ELIMINAR DEFINITIVAMENTE" || (body.kind === "account" ? !/^[a-f0-9-]{36}$/.test(body.target ?? "") : body.target != null)) {
    return response({ code: "invalid_request" },400);
  }
  const identity = await ctx.supabase.rpc("erasure_identity_v1");
  if (identity.error || !identity.data?.actorId || !identity.data?.sessionId) return response({ code: "administrator_required" },403);
  const { actorId, sessionId } = identity.data;
  const attempt = await ctx.supabaseAdmin.rpc("begin_erasure_password_attempt_v1", { p_actor: actorId, p_session: sessionId });
  if (attempt.error) return response({ code: "administrator_required" },403);
  if (attempt.data !== true) return response({ code: "rate_limited" },429);
  const account = await ctx.supabaseAdmin.auth.admin.getUserById(actorId);
  if (account.error || !account.data?.user?.email) return response({ code: "administrator_required" },403);
  const verifier = createClient(Deno.env.get("SUPABASE_URL")!,(Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY"))!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const checked = await verifier.auth.signInWithPassword({ email: account.data.user.email, password: body.password });
  body.password = "";
  if (checked.error || checked.data.user?.id !== actorId) return response({ code: "invalid_admin_password" },403);
  // Only close the ephemeral verification session, not the working Admin session.
  const signedOut = await verifier.auth.signOut({ scope: "local" });
  if (signedOut.error) return response({ code: "verification_failed" },503);
  const applied = await ctx.supabaseAdmin.rpc("execute_erasure_v1", {
    p_actor: actorId, p_session: sessionId, p_kind: body.kind,
    p_target: body.target ?? null, p_fingerprint: body.fingerprint,
  });
  if (applied.error) return response({ code: applied.error.code === "SR001" ? "preview_changed" : "erasure_blocked" },409);
  if (body.kind === "account") {
    const removed = await ctx.supabaseAdmin.auth.admin.deleteUser(body.target, false);
    await ctx.supabaseAdmin.rpc("cancel_erasure_v1", { p_actor: actorId, p_target: body.target });
    if (removed.error) return response({ code: "account_erasure_failed" },409);
  }
  return response({ ok: true, total: applied.data.total });
}

export default { fetch: withSupabase({ auth: "user" },handleAdminErasure) };
