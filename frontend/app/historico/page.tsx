import { HistoricalLinkManager } from "@/components/historical-link-manager";
import { MobileShell, requireRole } from "@/components/mobile-shell";

export default async function HistoricalPage() {
  const role = await requireRole((candidate) => candidate.administers);

  return (
    <MobileShell active="Histórico" role={role}>
      <main className="space-y-5 px-3 py-4 md:px-6 md:py-6 lg:px-7">
        <header>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Administración</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Histórico</h1>
          <p className="mt-1 text-sm text-ink-muted">Accede al Excel original sin copiarlo ni importarlo a la plataforma.</p>
        </header>
        <HistoricalLinkManager />
      </main>
    </MobileShell>
  );
}
