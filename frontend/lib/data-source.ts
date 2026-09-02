export const dataSources = ["demo", "supabase"] as const;
export type DataSource = (typeof dataSources)[number];

export function resolveDataSource(
  value: string | undefined = process.env.SISTEMA_R_DATA_SOURCE,
  vercelEnvironment: string | undefined = process.env.VERCEL_ENV,
): DataSource {
  if (value === undefined || value.trim() === "") {
    if (vercelEnvironment) {
      throw new Error(
        "SISTEMA_R_DATA_SOURCE es obligatorio en todos los despliegues de Vercel.",
      );
    }
    return "demo";
  }
  const normalized = value.trim();
  if (normalized === "demo") {
    if (vercelEnvironment) {
      throw new Error(
        "SISTEMA_R_DATA_SOURCE=demo está prohibido en todos los despliegues de Vercel.",
      );
    }
    return normalized;
  }
  if (normalized === "supabase") return normalized;
  throw new Error('SISTEMA_R_DATA_SOURCE debe ser "demo" o "supabase".');
}

export function isSupabaseDataSource() {
  return resolveDataSource() === "supabase";
}
