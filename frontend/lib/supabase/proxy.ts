import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appSessionCookieOptions } from "@/lib/supabase/cookie-options";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnvironment } from "@/lib/supabase/env";
import { applySecurityHeaders } from "@/lib/security-headers";

const protectedPrefixes = [
  "/actividades",
  "/burson",
  "/cuentas",
  "/historico",
  "/papelera",
  "/cambiar-clave",
];

export function secureRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  applySecurityHeaders(response.headers);
  return response;
}

export async function updateSupabaseSession(request: NextRequest) {
  const env = getSupabaseEnvironment();
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(
            name,
            value,
            appSessionCookieOptions(options),
          ),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const protectedRoute = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );
  if (!data?.claims && protectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/acceso";
    url.search = "";
    return secureRedirect(url);
  }
  if (data?.claims && protectedRoute) {
    const subject = data.claims.sub;
    const { data: profile } =
      typeof subject === "string"
        ? await supabase
            .from("profiles")
            .select("role, is_active, must_change_password")
            .eq("id", subject)
            .maybeSingle()
        : { data: null };
    if (!profile?.is_active) {
      const url = request.nextUrl.clone();
      url.pathname = "/acceso";
      url.search = "";
      return secureRedirect(url);
    }
    const changingPassword = request.nextUrl.pathname.startsWith(
      "/cambiar-clave",
    );
    if (profile.must_change_password && !changingPassword) {
      const url = request.nextUrl.clone();
      url.pathname = "/cambiar-clave";
      url.search = "";
      return secureRedirect(url);
    }
    if (!profile.must_change_password && changingPassword) {
      const url = request.nextUrl.clone();
      url.pathname = profile.role === "burson" ? "/burson" : "/actividades";
      url.search = "";
      return secureRedirect(url);
    }
  }
  return response;
}
