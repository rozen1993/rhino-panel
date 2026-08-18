import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { StatusPill } from "@/components/status-pill";
import { activities } from "@/lib/activities";
import { getSupervisionActions } from "@/lib/supervision";

const filterClass = "min-h-11 w-full rounded-[5px] border border-line bg-panel px-3 text-sm text-ink";

export default async function SupervisionPage() {
  const role = await requireRole((r) => r.supervises);
  return (
    <MobileShell active="Supervisión" role={role}>
      <main className="space-y-5 px-3 py-4 md:px-6 md:py-6 lg:px-7">
        <header>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Agosto 2026</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Panel de supervisión</h1>
          <p className="mt-1 text-sm text-ink-muted">Revisa respuestas, atiende al cliente y gobierna el trabajo del equipo.</p>
        </header>

        <section aria-labelledby="answered-title" className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-red">Observación interna</p><h2 className="mt-1 text-base font-bold" id="answered-title">Respondidas por cerrar</h2></div>
            <span className="text-xs font-bold tabular-nums text-red">1 pendiente</span>
          </div>
          <Card className="border-red bg-red/5 p-3">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-red">Observación · Chiara</p><h3 className="mt-1 text-sm font-bold leading-5">Cobertura de mantenimiento en peaje Chillón</h3></div><StatusPill status="Observada" /></div>
            <div className="mt-3 space-y-2 border-t border-red/30 pt-3 text-sm">
              <p><span className="font-bold">Observación:</span> «El plano del panel variable termina antes de mostrar el tránsito. Añade 8 segundos y nivela el audio ambiente.»</p>
              <p className="rounded-[5px] border border-line bg-panel p-2"><span className="font-bold">Respuesta de Johann:</span> «Plano extendido y audio nivelado. Reemplacé el archivo en el mismo enlace.»</p>
            </div>
            <Button className="mt-3 w-full">Resolver</Button>
          </Card>
        </section>

        <section aria-labelledby="client-feedback-title" className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-blue">AUNOR · opinión del cliente</p><h2 className="mt-1 text-base font-bold" id="client-feedback-title">Feedback por atender</h2></div>
            <span className="text-xs font-bold tabular-nums text-blue">1 pendiente</span>
          </div>
          <aside className="rounded-[5px] border border-blue bg-blue/10 p-3 text-xs font-semibold leading-5 text-ink">
            El feedback de AUNOR no cambia el estado de las actividades y no llega directo al colaborador.
          </aside>
          <Card className="border-blue p-3">
            <p className="text-xs font-bold text-blue">AUNOR · opinión del cliente · 16 ago, 17:40</p>
            <h3 className="mt-1 text-sm font-bold leading-5">Agenda de rodaje con cuadrilla norte</h3>
            <blockquote className="mt-3 border-l-[3px] border-blue bg-blue/5 px-3 py-2 text-sm leading-5">¿Podrían confirmar si la cuadrilla llegará antes del cierre de vía?</blockquote>
            <div className="mt-3 grid gap-2"><Button variant="secondary">Responder</Button><Button variant="secondary">Convertir en observación interna</Button><button className="min-h-10 text-xs font-bold text-ink-muted underline underline-offset-4" type="button">Descartar</button></div>
          </Card>
        </section>

        <section aria-labelledby="team-title" className="space-y-3">
          <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-blue">Vista completa</p><h2 className="mt-1 text-base font-bold" id="team-title">Actividades del equipo</h2></div>
          <div aria-label="Filtros" className="grid gap-2 lg:grid-cols-3">
            <label><span className="sr-only">Filtrar por tipo</span><select className={filterClass}><option>Todos los tipos</option><option>Grabación</option><option>Edición</option><option>Coordinación</option><option>Creatividad</option><option>Locución</option></select></label>
            <div className="grid grid-cols-2 gap-2"><label><span className="sr-only">Filtrar por estado</span><select className={filterClass}><option>Todos los estados</option><option>Programada</option><option>En proceso</option><option>Por subir</option><option>Entregada</option><option>Observada</option><option>Aprobada</option><option>Cancelada</option></select></label><label><span className="sr-only">Filtrar por responsable</span><select className={filterClass}><option>Responsable</option><option>Sin asignar</option></select></label></div>
          </div>

          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {activities.map((activity) => {
              const actions = getSupervisionActions(activity.status);
              const observed = activity.status === "Observada";
              return (
                <Card className={`relative overflow-hidden p-3 ${observed ? "border-observed bg-red/5 pl-4" : ""}`} key={activity.id}>
                  {observed && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-observed" />}
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-blue">{activity.date} · {activity.type}</p><h3 className="mt-1 text-sm font-bold leading-5">{activity.title}</h3><p className="mt-1 text-xs text-ink-muted">Responsable: <span className="font-semibold text-ink">{activity.responsible}</span></p></div><StatusPill status={activity.status} /></div>
                  {actions.length > 0 && <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">{actions.map((action) => <Button className="min-h-9 flex-1 px-3 py-1 text-xs" key={action} variant={action === "Aprobar" ? "primary" : "secondary"}>{action}</Button>)}</div>}
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
