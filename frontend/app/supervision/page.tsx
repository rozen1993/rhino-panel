import { MobileShell, requireRole } from "@/components/mobile-shell";
import { SupervisionDashboard } from "@/components/supervision-dashboard";

export default async function SupervisionPage() {
  const role = await requireRole((candidate) => candidate.supervises);
  return <MobileShell active="Supervisión" role={role}>
    <main className="space-y-5 px-3 py-4 md:px-6 md:py-6 lg:px-7">
      <header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Agosto 2026</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Panel de supervisión</h1><p className="mt-1 text-sm text-ink-muted">Revisa respuestas, atiende al cliente y gobierna el trabajo del equipo.</p></header>
      <SupervisionDashboard role={role} />
    </main>
  </MobileShell>;
}
