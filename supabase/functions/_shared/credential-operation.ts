// A DB mutex spans the Auth write, SQL finalization and metadata cleanup.
// There is deliberately no timeout-based unlock: a timed-out Auth request
// can still finish later. Reconcile ambiguous failures before manual release.
export async function credentialOperation(
  ctx: any,
  profileId: string,
  actorId: string,
  work: () => Promise<Response>,
) {
  const operationId = crypto.randomUUID();
  const { error } = await ctx.supabaseAdmin.rpc("begin_credential_operation_v1", {
    p_profile_id: profileId, p_actor_id: actorId, p_operation_id: operationId,
  });
  if (error) return Response.json({ ok: false, code: "credential_operation_busy" }, { status: 409 });
  try {
    const result = await work();
    const payload = await result.clone().json().catch(() => ({}));
    // SDKs may encode a timed-out write as an error result instead of throwing.
    // Do not unlock merely because the handler translated it to HTTP 409.
    if (["auth_reset_failed", "auth_update_failed", "finalize_failed", "reset_confirm_failed"].includes(payload.code)
      || payload.fingerprintCleanupPending || result.status >= 500) return result;
    const { error: releaseError } = await ctx.supabaseAdmin.rpc("end_credential_operation_v1", {
      p_profile_id: profileId, p_operation_id: operationId,
    });
    if (releaseError) return Response.json({ ok: false, code: "credential_reconciliation_required" }, { status: 409 });
    return result;
  } catch {
    // Keep the durable lock when completion of an external write is unknown.
    return Response.json({ ok: false, code: "credential_reconciliation_required" }, { status: 409 });
  }
}
