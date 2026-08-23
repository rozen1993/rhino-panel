export type SupabaseEnvironment = {
  url: string;
  publishableKey: string;
  usernameDomain: string;
};

function required(name: "SUPABASE_URL" | "SUPABASE_PUBLISHABLE_KEY") {
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
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "127.0.0.1") {
      throw new Error("protocol");
    }
  } catch {
    throw new Error("SUPABASE_URL no contiene una URL válida de Supabase.");
  }

  const usernameDomain =
    process.env.SISTEMA_R_USERNAME_DOMAIN?.trim().toLowerCase() ||
    "auth.sistema-r.invalid";
  if (!/^[a-z0-9.-]+$/.test(usernameDomain) || !usernameDomain.includes(".")) {
    throw new Error("SISTEMA_R_USERNAME_DOMAIN no contiene un dominio válido.");
  }

  return {
    url,
    publishableKey: required("SUPABASE_PUBLISHABLE_KEY"),
    usernameDomain,
  };
}
