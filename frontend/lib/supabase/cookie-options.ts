import type { CookieOptions } from "@supabase/ssr";

/**
 * Sistema R autentica exclusivamente desde el servidor. Por eso sus cookies
 * pueden ser HttpOnly y de sesión: desaparecen al cerrar el navegador. El
 * registro `app_sessions` conserva además el límite absoluto de 12 horas.
 */
export function appSessionCookieOptions(
  options: CookieOptions,
  secure = process.env.NODE_ENV === "production",
): CookieOptions {
  if (options.maxAge === 0) return { ...options, httpOnly: true, secure };
  const sessionOptions = { ...options };
  delete sessionOptions.maxAge;
  delete sessionOptions.expires;
  return { ...sessionOptions, httpOnly: true, secure };
}

export function isSupabaseAuthCookieName(name: string) {
  return /^sb-[a-z0-9-]+-auth-token(?:\.\d+)?$/i.test(name);
}
