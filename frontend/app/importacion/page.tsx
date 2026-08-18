import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { MobileShell } from "@/components/mobile-shell";
import { importSimulation } from "@/lib/import-simulation";

export default function ImportPage() {
  const total = importSimulation.accepted.length + importSimulation.rejected.length;

  return (
    <MobileShell active="Importar" initials="MV" supervision user="Martín">
      <main className="space-y-5 px-3 py-4 md:px-6 md:py-6 lg:px-7">
        <header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Administración</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Importar histórico</h1><p className="mt-1 text-sm text-ink-muted">Revisa la simulación antes de confirmar el lote.</p></header>

        <Card className="p-3">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-blue">Archivo cargado</p><p className="mt-1 text-sm font-bold">{importSimulation.fileName}</p><p className="mt-1 text-xs text-ink-muted">Ejemplo ficticio · no se enviará ningún archivo</p></div><Button className="shrink-0 px-3 text-xs" variant="secondary">Cargar otro</Button></div>
        </Card>

        <section aria-label="Totales de simulación" className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center"><strong className="block text-2xl tabular-nums">{total}</strong><span className="text-[0.625rem] font-bold uppercase tracking-wide text-ink-muted">Total</span></Card>
          <Card className="border-green p-3 text-center"><strong className="block text-2xl tabular-nums">{importSimulation.accepted.length}</strong><span className="text-[0.625rem] font-bold uppercase tracking-wide text-ink-muted">Entrarían</span></Card>
          <Card className="border-red p-3 text-center"><strong className="block text-2xl tabular-nums">{importSimulation.rejected.length}</strong><span className="text-[0.625rem] font-bold uppercase tracking-wide text-ink-muted">Rechazadas</span></Card>
        </section>

        <aside className="rounded-[5px] border border-amber bg-amber/15 p-3 text-xs leading-5"><span className="font-bold">Simulación de interfaz:</span> el Excel real y sus reglas de estado todavía están pendientes. Esta pantalla no decide cómo se migrarán.</aside>

        <section aria-labelledby="accepted-title" className="space-y-2">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-green">Listas para importar</p><h2 className="mt-1 text-base font-bold" id="accepted-title">Filas que entrarían</h2></div><span className="text-xs font-bold tabular-nums">{importSimulation.accepted.length}</span></div>
          <div className="space-y-2 lg:hidden">{importSimulation.accepted.map((row) => <Card className="border-l-[3px] border-l-green p-3" key={row.row}><div className="flex items-start gap-3"><span className="rounded-[5px] bg-green px-2 py-1 text-xs font-bold tabular-nums">Fila {row.row}</span><div><p className="text-sm font-bold leading-5">{row.title}</p><p className="mt-1 text-xs text-ink-muted">{row.date} · {row.place}</p></div></div></Card>)}</div>
          <div className="hidden overflow-hidden rounded-[5px] border border-line bg-panel lg:block"><table className="w-full border-collapse text-left text-sm"><thead className="bg-panel-secondary text-[0.6875rem] uppercase tracking-[0.1em] text-blue"><tr><th className="w-24 px-4 py-3" scope="col">Fila</th><th className="w-40 px-4 py-3" scope="col">Fecha</th><th className="px-4 py-3" scope="col">Actividad</th><th className="w-[24%] px-4 py-3" scope="col">Lugar</th></tr></thead><tbody className="divide-y divide-line">{importSimulation.accepted.map((row) => <tr key={row.row}><td className="border-l-[3px] border-green px-4 py-3 font-bold tabular-nums">{row.row}</td><td className="px-4 py-3 tabular-nums">{row.date}</td><td className="px-4 py-3 font-bold">{row.title}</td><td className="px-4 py-3 text-ink-muted">{row.place}</td></tr>)}</tbody></table></div>
        </section>

        <section aria-labelledby="rejected-title" className="space-y-2">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-red">No se importarían</p><h2 className="mt-1 text-base font-bold" id="rejected-title">Filas rechazadas</h2></div><span className="text-xs font-bold tabular-nums text-red">{importSimulation.rejected.length}</span></div>
          <div className="space-y-2 lg:hidden">{importSimulation.rejected.map((row) => <Card className="border-l-[3px] border-l-red bg-red/5 p-3" key={row.row}><div className="flex items-start gap-3"><span className="rounded-[5px] bg-red px-2 py-1 text-xs font-bold text-white tabular-nums">Fila {row.row}</span><div><p className="text-sm font-bold leading-5">{row.summary}</p><p className="mt-1 text-xs text-red">Motivo: {row.reason}</p></div></div></Card>)}</div>
          <div className="hidden overflow-hidden rounded-[5px] border border-line bg-panel lg:block"><table className="w-full border-collapse text-left text-sm"><thead className="bg-panel-secondary text-[0.6875rem] uppercase tracking-[0.1em] text-blue"><tr><th className="w-24 px-4 py-3" scope="col">Fila</th><th className="w-[35%] px-4 py-3" scope="col">Contenido</th><th className="px-4 py-3" scope="col">Motivo del rechazo</th></tr></thead><tbody className="divide-y divide-line">{importSimulation.rejected.map((row) => <tr className="bg-red/5" key={row.row}><td className="border-l-[3px] border-red px-4 py-3 font-bold tabular-nums text-red">{row.row}</td><td className="px-4 py-3 font-bold">{row.summary}</td><td className="px-4 py-3 text-red">{row.reason}</td></tr>)}</tbody></table></div>
        </section>

        <div className="grid grid-cols-2 gap-2 lg:ml-auto lg:w-80"><Button variant="secondary">Cancelar</Button><Button>Confirmar</Button></div>
      </main>
    </MobileShell>
  );
}
