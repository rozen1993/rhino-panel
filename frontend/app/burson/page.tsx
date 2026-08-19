import { BursonDashboard } from "@/components/burson-dashboard";
import { MobileShell, requireRole } from "@/components/mobile-shell";

export default async function BursonPage() {
  const role = await requireRole((candidate) => candidate.seesBurson);
  return <MobileShell active="Burson" role={role}><main className="space-y-5 px-3 py-4 md:px-6 md:py-6 lg:px-7"><header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Coordinación externa</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Tablero Burson</h1><p className="mt-1 text-sm text-ink-muted">Seguimiento de solicitudes y pendientes de ambas partes.</p></header><BursonDashboard role={role} /></main></MobileShell>;
}
