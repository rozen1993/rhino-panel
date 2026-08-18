import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { type Activity } from "@/lib/activities";

export function ActivityTable({ activities, showResponsible = false }: { activities: readonly Activity[]; showResponsible?: boolean }) {
  return (
    <div className="hidden overflow-hidden rounded-[5px] border border-line bg-panel lg:block">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <thead className="bg-panel-secondary text-[0.6875rem] uppercase tracking-[0.1em] text-blue">
          <tr>
            <th className="w-[9rem] px-4 py-3" scope="col">Fecha</th>
            <th className="px-4 py-3" scope="col">Actividad</th>
            <th className="w-[18%] px-4 py-3" scope="col">Ubicación</th>
            {showResponsible && <th className="w-[12%] px-4 py-3" scope="col">Responsable</th>}
            <th className="w-[10.5rem] px-4 py-3" scope="col">Estado</th>
            <th className="w-[8rem] px-4 py-3 text-center" scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {activities.map((activity) => {
            const observed = activity.status === "Observada";
            return (
              <tr className={observed ? "border-l-4 border-observed bg-red/5" : ""} key={activity.id}>
                <td className="px-4 py-3 font-bold tabular-nums text-blue">{activity.date}</td>
                <td className="px-4 py-3"><span className="block font-bold">{activity.title}</span><span className="mt-0.5 block text-xs text-ink-muted">{activity.type}</span></td>
                <td className="px-4 py-3 text-ink-muted">{activity.place}</td>
                {showResponsible && <td className="px-4 py-3 font-semibold">{activity.responsible}</td>}
                <td className="px-4 py-3"><StatusPill status={activity.status} /></td>
                <td className="px-4 py-3"><div className="flex justify-center gap-2"><Link className="flex min-h-9 items-center justify-center rounded-[5px] border border-line bg-panel px-3 text-xs font-bold text-blue" href={`/actividades/${activity.id}`}>Ver</Link><Link className="flex min-h-9 items-center justify-center rounded-[5px] border border-line bg-panel px-3 text-xs font-bold text-blue" href={`/actividades/nueva?editar=${activity.id}`}>Editar</Link></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
