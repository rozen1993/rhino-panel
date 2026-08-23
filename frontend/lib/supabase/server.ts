import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { appSessionCookieOptions } from "@/lib/supabase/cookie-options";
import { getSupabaseEnvironment } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getSupabaseEnvironment();

  return createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(
              name,
              value,
              appSessionCookieOptions(options),
            ),
          );
        } catch {
          // Los Server Components no pueden escribir cookies. El Proxy se
          // encarga de refrescarlas antes de que el componente se renderice.
        }
      },
    },
  });
}
