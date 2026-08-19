import { AunorDashboard } from "@/components/aunor-dashboard";
import { requireRole } from "@/components/mobile-shell";

export default async function AunorPage() {
  await requireRole((role) => role.externalView === "aunor");
  return <div className="mx-auto min-h-screen w-full max-w-[390px] bg-paper md:max-w-[768px] lg:max-w-none">
    <header className="border-b border-line bg-panel px-4 py-4"><div className="flex items-center justify-between gap-4"><span className="text-base font-bold tracking-tight">AUNOR</span><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue">Rhino Audiovisuales</span></div></header>
    <main className="mx-auto max-w-[1440px] space-y-5 px-3 py-4 md:px-6 md:py-6 lg:px-7"><header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Agosto 2026</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Seguimiento mensual</h1><p className="mt-1 text-xs text-ink-muted">Información actualizada por Rhino Audiovisuales</p></header><AunorDashboard /></main>
  </div>;
}
