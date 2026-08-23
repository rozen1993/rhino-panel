import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appSessionCookieOptions } from "@/lib/supabase/cookie-options";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnvironment } from "@/lib/supabase/env";

const protectedPrefixes = [
  "/actividades",
  "/burson",
  "/cuentas",
  "/historico",
];

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
    return NextResponse.redirect(url);
  }
  return response;
}
