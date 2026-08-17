import { BursonStatusPill } from "@/components/burson-status-pill";
import { Card } from "@/components/card";
import { MobileShell } from "@/components/mobile-shell";
import { bursonRequests } from "@/lib/burson";

export default function BursonPage() {
  return (
    <MobileShell active="Burson" initials="MV" supervision user="Martín">
      <main className="space-y-5 px-3 py-4">
        <header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Coordinación externa</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Tablero Burson</h1><p className="mt-1 text-sm text-ink-muted">Seguimiento interno de solicitudes y pendientes de ambas partes.</p></header>

        <section aria-label="Resumen de pendientes" className="grid grid-cols-2 gap-2">
          <Card className="border-blue p-3"><span className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-blue">Pendientes de Rhino</span><strong className="mt-2 block text-3xl tabular-nums">2</strong><span className="text-xs text-ink-muted">Requieren acción interna</span></Card>
          <Card className="border-amber p-3"><span className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink">Pendientes de Burson</span><strong className="mt-2 block text-3xl tabular-nums">3</strong><span className="text-xs text-ink-muted">Esperando respuesta</span></Card>
        </section>

        <section aria-labelledby="requests-title" className="space-y-2">
          <div className="flex items-end justify-between gap-3"><h2 className="text-sm font-bold uppercase tracking-[0.1em]" id="requests-title">Solicitudes</h2><span className="text-xs text-ink-muted">3 abiertas</span></div>
          {bursonRequests.map((item) => (
            <Card className="p-3" key={item.id}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-blue">{item.date}</p><h3 className="mt-1 text-sm font-bold leading-5">{item.request}</h3></div><BursonStatusPill status={item.status} /></div>
              <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs"><div><dt className="font-bold">Responsable de Rhino</dt><dd className="mt-1 text-ink-muted">{item.responsible}</dd></div><div><dt className="font-bold">Material solicitado</dt><dd className="mt-1 text-ink-muted">{item.material}</dd></div></dl>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-[5px] border border-blue bg-blue/5 p-2"><p className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-blue">Rhino debe</p><p className="mt-1 text-xs font-semibold leading-4">{item.rhinoPending}</p></div>
                <div className="rounded-[5px] border border-amber bg-amber/10 p-2"><p className="text-[0.625rem] font-bold uppercase tracking-[0.1em]">Burson debe</p><p className="mt-1 text-xs font-semibold leading-4">{item.bursonPending}</p></div>
              </div>
            </Card>
          ))}
        </section>
      </main>
    </MobileShell>
  );
}
