import Link from "next/link";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { MobileShell } from "@/components/mobile-shell";
import { StatusPill } from "@/components/status-pill";
import { SystemIcon } from "@/components/system-icon";
import { activities } from "@/lib/activities";

export default function HistoryPage() {
  return (
    <MobileShell active="Historial" coordination initials="CH" user="Chiara">
      <main className="space-y-4 px-3 py-4 md:px-6 md:py-6 lg:px-7">
        <header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Agosto 2026</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Historial mensual</h1></header>
        <section aria-label="Filtros" className="space-y-2 lg:grid lg:grid-cols-[minmax(18rem,1fr)_minmax(18rem,auto)] lg:gap-3 lg:space-y-0">
          <label className="relative block"><span className="sr-only">Buscar actividad</span><SystemIcon className="absolute left-3 top-3 size-5 text-ink-muted" name="search" /><input className="min-h-11 w-full rounded-[5px] border border-line bg-panel py-2 pl-10 pr-3 text-sm" placeholder="Buscar actividad…" type="search" /></label>
          <div className="grid grid-cols-[1fr_auto] gap-2"><label><span className="sr-only">Filtrar por estado</span><select className="min-h-11 w-full rounded-[5px] border border-line bg-panel px-3 text-sm"><option>Todos los estados</option><option>Programada</option><option>En proceso</option><option>Por subir</option><option>Entregada</option><option>Observada</option><option>Aprobada</option><option>Cancelada</option></select></label><Button variant="secondary">Exportar</Button></div>
        </section>

        <section aria-label="Actividades de agosto" className="space-y-2">
          <div className="space-y-2 lg:hidden">{activities.map((activity) => (
            <Card className={activity.status === "Observada" ? "border-observed bg-red/5 p-3" : "p-3"} key={activity.id}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold tabular-nums text-blue">{activity.date}</p><h2 className="mt-1 text-sm font-bold leading-5">{activity.title}</h2></div><StatusPill status={activity.status} /></div>
              <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs"><div><dt className="font-bold">Lugar</dt><dd className="mt-0.5 text-ink-muted">{activity.place}</dd></div><div><dt className="font-bold">Enlace</dt><dd className="mt-0.5 text-ink-muted">{activity.hasLink ? "Sí" : "No"}</dd></div></dl>
              <div className="mt-3 grid grid-cols-2 gap-2"><Link className="flex min-h-10 items-center justify-center rounded-[5px] border border-line bg-panel text-xs font-bold text-blue" href={`/actividades/${activity.id}`}>Ver</Link><Link className="flex min-h-10 items-center justify-center rounded-[5px] border border-line bg-panel text-xs font-bold text-blue" href={`/actividades/nueva?editar=${activity.id}`}>Editar</Link></div>
            </Card>
          ))}</div>
          <div className="hidden overflow-hidden rounded-[5px] border border-line bg-panel lg:block">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead className="bg-panel-secondary text-[0.6875rem] uppercase tracking-[0.1em] text-blue"><tr><th className="w-[9rem] px-4 py-3" scope="col">Fecha</th><th className="px-4 py-3" scope="col">Actividad</th><th className="w-[18%] px-4 py-3" scope="col">Lugar</th><th className="w-[10.5rem] px-4 py-3" scope="col">Estado</th><th className="w-20 px-4 py-3 text-center" scope="col">Enlace</th><th className="w-[8rem] px-4 py-3 text-center" scope="col">Acciones</th></tr></thead>
              <tbody className="divide-y divide-line">{activities.map((activity) => <tr className={activity.status === "Observada" ? "border-l-4 border-observed bg-red/5" : ""} key={activity.id}><td className="px-4 py-3 font-bold tabular-nums text-blue">{activity.date}</td><td className="px-4 py-3 font-bold">{activity.title}</td><td className="px-4 py-3 text-ink-muted">{activity.place}</td><td className="px-4 py-3"><StatusPill status={activity.status} /></td><td className="px-4 py-3 text-center font-semibold">{activity.hasLink ? "Sí" : "No"}</td><td className="px-4 py-3"><div className="flex justify-center gap-2"><Link className="rounded-[5px] border border-line bg-panel px-3 py-2 text-xs font-bold text-blue" href={`/actividades/${activity.id}`}>Ver</Link><Link className="rounded-[5px] border border-line bg-panel px-3 py-2 text-xs font-bold text-blue" href={`/actividades/nueva?editar=${activity.id}`}>Editar</Link></div></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
