export type DashboardFilters = { month: number; year: number; query: string; status: string };
const statuses = ["", "Programada", "En proceso", "Entregada"];

export function parseDashboardFilters(search: string, fallback: Pick<DashboardFilters, "month" | "year">): DashboardFilters {
  const params = new URLSearchParams(search);
  const period = params.get("periodo") ?? "";
  const valid = /^(20\d{2})-(0[1-9]|1[0-2])$/.test(period) && Number(period.slice(0, 4)) >= 2026;
  return {
    month: valid ? Number(period.slice(5)) - 1 : fallback.month,
    year: valid ? Number(period.slice(0, 4)) : fallback.year,
    query: (params.get("buscar") ?? "").slice(0, 200),
    status: statuses.includes(params.get("estado") ?? "") ? params.get("estado") ?? "" : "",
  };
}

export function dashboardHref(filters: DashboardFilters) {
  const params = new URLSearchParams({ periodo: `${filters.year}-${String(filters.month + 1).padStart(2, "0")}` });
  if (filters.query) params.set("buscar", filters.query);
  if (filters.status) params.set("estado", filters.status);
  return `/actividades?${params}`;
}

export function activityDetailHref(id: string, returnTo?: string) {
  return `/actividades/${encodeURIComponent(id)}${returnTo ? `?volver=${encodeURIComponent(returnTo)}` : ""}`;
}

/** Only the local activity dashboard is an allowed return destination. */
export function safeDashboardReturn(value: string | string[] | undefined) {
  if (typeof value !== "string" || !value.startsWith("/actividades?")) return "/actividades";
  const params = new URLSearchParams(value.slice("/actividades?".length));
  if (!/^(20\d{2})-(0[1-9]|1[0-2])$/.test(params.get("periodo") ?? "")) return "/actividades";
  return dashboardHref(parseDashboardFilters(params.toString(), { month: 0, year: 2026 }));
}
export function safeActivityReturn(value:string|string[]|undefined,admin=false){
  if(admin&&typeof value==='string'&&value.startsWith('/contrato?')){
    const month=new URLSearchParams(value.slice('/contrato?'.length)).get('mes');
    if(month&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))return `/contrato?mes=${month}`;
  }
  return safeDashboardReturn(value);
}
