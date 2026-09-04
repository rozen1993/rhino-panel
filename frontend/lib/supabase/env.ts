import { isValidUsernameDomain } from "@/lib/supabase/identity";

export type SupabaseEnvironment = {
  url: string;
  publishableKey: string;
  usernameDomain: string;
};

export const supabasePublishableKeyPatternSource =
  "^sb_publishable_[A-Za-z0-9_-]{8,}$";

function required(
  name:
    | "SUPABASE_URL"
    | "SUPABASE_PUBLISHABLE_KEY"
    | "SISTEMA_R_USERNAME_DOMAIN",
) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Falta ${name}. El modo Supabase nunca utiliza datos de demostración como respaldo.`,
    );
  }
  return value;
}

export function getSupabaseEnvironment(): SupabaseEnvironment {
  const url = required("SUPABASE_URL");
  const publishableKey = required("SUPABASE_PUBLISHABLE_KEY");
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "127.0.0.1") {
      throw new Error("protocol");
    }
  } catch {
    throw new Error("SUPABASE_URL no contiene una URL válida de Supabase.");
  }

  const usernameDomain = required("SISTEMA_R_USERNAME_DOMAIN").toLowerCase();
  if (!isValidUsernameDomain(usernameDomain)) {
    throw new Error("SISTEMA_R_USERNAME_DOMAIN no contiene un dominio válido.");
  }
  if (
    process.env.VERCEL_ENV &&
    !new RegExp(supabasePublishableKeyPatternSource).test(publishableKey)
  ) {
    throw new Error(
      "SUPABASE_PUBLISHABLE_KEY debe ser publicable en todos los despliegues de Vercel.",
    );
  }

  return {
    url,
    publishableKey,
    usernameDomain,
  };
}
