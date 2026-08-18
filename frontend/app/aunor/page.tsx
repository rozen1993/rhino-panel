import { AunorStatusPill, aunorStatuses } from "@/components/aunor-status-pill";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { MonthStrip } from "@/components/month-strip";
import { aunorActivities } from "@/lib/aunor";

const totals = Object.fromEntries(aunorStatuses.map((status) => [status, aunorActivities.filter((activity) => activity.status === status).length]));

export default function AunorPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px] bg-paper md:max-w-[768px] lg:max-w-none">
      <header className="border-b border-line bg-panel px-4 py-4">
        <div className="flex items-center justify-between gap-4"><span className="text-base font-bold tracking-tight">AUNOR</span><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue">Rhino Audiovisuales</span></div>
      </header>
      <main className="mx-auto max-w-[1440px] space-y-5 px-3 py-4 md:px-6 md:py-6 lg:px-7">
        <header>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Agosto 2026</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Seguimiento mensual</h1>
          <p className="mt-1 text-xs text-ink-muted">Última actualización: 17 ago 2026 · 18:25</p>
        </header>

        <MonthStrip activeMonth="AGO" counts={[0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0]} />

        <section aria-labelledby="groups-title" className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em]" id="groups-title">Estado del mes</h2>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5 lg:gap-4">
            {aunorStatuses.map((status) => <Card className="flex min-h-20 flex-col items-start justify-between p-3" key={status}><AunorStatusPill status={status} /><span className="mt-2 text-2xl font-bold tabular-nums">{totals[status]}</span></Card>)}
          </div>
        </section>

        <section aria-labelledby="aunor-activities-title" className="space-y-2">
          <div className="flex items-end justify-between gap-3"><h2 className="text-sm font-bold uppercase tracking-[0.1em]" id="aunor-activities-title">Actividades</h2><span className="text-xs text-ink-muted">5 visibles</span></div>
          <div className="space-y-2 lg:hidden">{aunorActivities.map((activity) => (
            <Card className="p-3" key={activity.id}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-blue">{activity.date} · {activity.type}</p><h3 className="mt-1 text-sm font-bold leading-5">{activity.title}</h3><p className="mt-1 text-xs text-ink-muted">{activity.place}</p></div><AunorStatusPill status={activity.status} /></div>
              {activity.comments.length > 0 && <div className="mt-3 space-y-2 border-t border-line pt-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-blue">Comentarios anteriores</p>{activity.comments.map((comment) => <blockquote className="border-l-[3px] border-blue bg-blue/5 px-3 py-2 text-sm leading-5" key={`${activity.id}-${comment.date}`}><span className="mb-1 block text-[0.6875rem] font-bold text-blue">{comment.date}</span>{comment.text}</blockquote>)}</div>}
              <div className="mt-3 border-t border-line pt-3"><label className="text-sm font-bold" htmlFor={`comment-${activity.id}`}>Dejar una opinión</label><textarea className="mt-2 min-h-20 w-full resize-y rounded-[5px] border border-line bg-panel px-3 py-2 text-sm placeholder:text-ink-muted" id={`comment-${activity.id}`} placeholder="Escribe un comentario sobre esta actividad" /><Button className="mt-2 w-full" type="button">Enviar opinión</Button></div>
            </Card>
          ))}</div>
          <div className="hidden overflow-hidden rounded-[5px] border border-line bg-panel lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-panel-secondary text-[0.6875rem] uppercase tracking-[0.1em] text-blue"><tr><th className="w-40 px-4 py-3" scope="col">Fecha</th><th className="w-32 px-4 py-3" scope="col">Tipo</th><th className="px-4 py-3" scope="col">Actividad</th><th className="w-[18%] px-4 py-3" scope="col">Ubicación</th><th className="w-40 px-4 py-3" scope="col">Estado agrupado</th><th className="w-[24%] px-4 py-3" scope="col">Opinión</th></tr></thead>
              <tbody className="divide-y divide-line">{aunorActivities.map((activity) => <tr key={activity.id}><td className="px-4 py-3 font-bold tabular-nums text-blue">{activity.date}</td><td className="px-4 py-3">{activity.type}</td><td className="px-4 py-3 font-bold">{activity.title}</td><td className="px-4 py-3 text-ink-muted">{activity.place}</td><td className="px-4 py-3"><AunorStatusPill status={activity.status} /></td><td className="px-4 py-3">{activity.comments.map((comment) => <p className="mb-2 border-l-[3px] border-blue pl-2 text-xs leading-4" key={`${activity.id}-${comment.date}`}><span className="block font-bold text-blue">{comment.date}</span>{comment.text}</p>)}<label className="sr-only" htmlFor={`table-comment-${activity.id}`}>Dejar una opinión sobre {activity.title}</label><textarea className="min-h-16 w-full resize-y rounded-[5px] border border-line bg-panel px-3 py-2 text-xs placeholder:text-ink-muted" id={`table-comment-${activity.id}`} placeholder="Escribe un comentario" /><Button className="mt-2 min-h-9 w-full py-1 text-xs" type="button">Enviar opinión</Button></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
