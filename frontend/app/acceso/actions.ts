"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { accountsCookieName } from "@/lib/accounts";
import { resolveDataSource } from "@/lib/data-source";
import { roleHome } from "@/lib/roles";
import { SESSION_ACCOUNT_COOKIE, SESSION_COOKIE, findTestUser } from "@/lib/session";
import { getSupabaseEnvironment } from "@/lib/supabase/env";
import { usernameToAuthEmail } from "@/lib/supabase/identity";
import { isSupabaseAuthCookieName } from "@/lib/supabase/cookie-options";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const invalidCredentials = "El usuario o la clave no son correctos.";
const demoSessionCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
};

export async function entrar(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const username = String(formData.get("usuario") ?? "");
  const password = String(formData.get("clave") ?? "");
  if (resolveDataSource() === "supabase") {
    let email: string;
    try {
      email = usernameToAuthEmail(username, getSupabaseEnvironment().usernameDomain);
    } catch {
      return invalidCredentials;
    }
    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) return invalidCredentials;
    const { error: sessionError } = await supabase.rpc("register_app_session");
    if (sessionError) {
      await supabase.auth.signOut();
      return invalidCredentials;
    }
    const { data: claimsData } = await supabase.auth.getClaims();
    const subject = claimsData?.claims?.sub;
    if (typeof subject !== "string") {
      await supabase.auth.signOut();
      return invalidCredentials;
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active, must_change_password")
      .eq("id", subject)
      .maybeSingle();
    if (profileError || !profile?.is_active) {
      await supabase.auth.signOut();
      return invalidCredentials;
    }
    if (profile.must_change_password) redirect("/cambiar-clave");
    redirect(roleHome(profile.role));
  }

  const store = await cookies();
  const match = findTestUser(
    username,
    password,
    store.get(accountsCookieName)?.value,
  );
  if (!match) return invalidCredentials;
  store.set(SESSION_COOKIE, match.roleId, demoSessionCookieOptions);
  store.set(
    SESSION_ACCOUNT_COOKIE,
    match.accountId,
    demoSessionCookieOptions,
  );
  if (match.mustChangePassword) redirect("/cambiar-clave");
  redirect(roleHome(match.roleId));
}

export async function salir() {
  if (resolveDataSource() === "supabase") {
    const supabase = await createSupabaseServerClient();
    let revokeFailed = false;
    try {
      const { error } = await supabase.rpc("revoke_current_app_session");
      revokeFailed = Boolean(error);
    } catch {
      revokeFailed = true;
    }
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      revokeFailed ||= Boolean(error);
    } catch {
      revokeFailed = true;
    }

    // Defensa final ante una caída de Auth: el navegador no conserva el token
    // aunque la revocación remota tenga que expirar a las 12 horas.
    const store = await cookies();
    for (const cookie of store.getAll()) {
      if (isSupabaseAuthCookieName(cookie.name)) store.delete(cookie.name);
    }
    if (revokeFailed) {
      console.warn(
        "La sesión local se cerró, pero Supabase no confirmó toda la revocación remota.",
      );
    }
  } else {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    store.delete(SESSION_ACCOUNT_COOKIE);
  }
  redirect("/acceso");
}
