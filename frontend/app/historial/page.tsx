import { ActivityHistory } from "@/components/activity-history";
import { MobileShell, requireRole } from "@/components/mobile-shell";

export default async function HistoryPage() {
  const role = await requireRole((candidate) => candidate.kind === "trabajo" || candidate.supervises);
  return <MobileShell active="Historial" role={role}><main className="space-y-4 px-3 py-4 md:px-6 md:py-6 lg:px-7"><header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Registro de actividades</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Historial mensual</h1><p className="mt-1 text-sm text-ink-muted">Consulta actividades y revisa cada cambio de estado.</p></header><ActivityHistory role={role} /></main></MobileShell>;
}
