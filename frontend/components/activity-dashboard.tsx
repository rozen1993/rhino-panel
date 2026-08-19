"use client";

import Link from "next/link";
import { ActivityCard } from "@/components/activity-card";
import { ActivityTable } from "@/components/activity-table";
import { MonthStrip } from "@/components/month-strip";
import { SummaryTile } from "@/components/summary-tile";
import { SystemIcon } from "@/components/system-icon";
import { useActivityStoreHealth, useSimulatedActivities } from "@/lib/activity-simulation";
import type { Role } from "@/lib/roles";

export function ActivityDashboard({ role }: { role: Role }) {
  const stored = useSimulatedActivities();
  const { corrupt } = useActivityStoreHealth();
  const activities = role.seesAllActivities ? stored : stored.filter((activity) => activity.type === role.activityType);
  const counts = Array.from({ length: 12 }, (_, month) => activities.filter((activity) => new Date(activity.dateTime).getMonth() === month).length);
  const countStatus = (status: string) => activities.filter((activity) => activity.status === status).length;
  const finished = activities.filter((activity) => ["Entregada", "Aprobada"].includes(activity.status)).length;

  return <>
    {corrupt && <p role="alert" className="rounded-[5px] border border-red bg-red/5 p-3 text-sm font-bold text-red">Los datos locales estaban dañados. Se muestran los datos iniciales; borra los datos del sitio para restablecer el almacenamiento.</p>}
    <MonthStrip activeMonth="AGO" counts={counts} />
    <section aria-label="Resumen mensual" className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4">
      <SummaryTile detail="Este mes" icon={<SystemIcon className="size-6" name="activities" />} iconClassName="bg-blue text-white" label="Total" value={activities.length} />
      <SummaryTile detail="Por iniciar" icon={<SystemIcon className="size-6" name="calendar" />} iconClassName="bg-red text-white" label="Programadas" value={countStatus("Programada")} />
      <SummaryTile detail="Trabajo activo" icon={<SystemIcon className="size-6" name="progress" />} iconClassName="bg-turquoise text-white" label="En proceso" value={countStatus("En proceso")} />
      <SummaryTile detail="Entregadas" icon={<SystemIcon className="size-6" name="complete" />} iconClassName="bg-green text-ink" label="Finalizadas" value={finished} />
    </section>
    <section aria-labelledby="activity-list-title" className="space-y-2">
      <div className="flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-[0.1em]" id="activity-list-title">Trabajo diario</h2><span className="text-xs text-ink-muted">{activities.length} actividades</span></div>
      {activities.length === 0 ? <p className="rounded-[5px] border border-line bg-panel p-6 text-center text-sm text-ink-muted">Todavía no hay actividades para este rol.</p> : <><div className="space-y-2 lg:hidden">{activities.map((activity) => <ActivityCard activity={activity} key={activity.id} showResponsible={role.seesAllActivities} />)}</div><ActivityTable activities={activities} showResponsible={role.seesAllActivities} /></>}
    </section>
    <Link className="sticky bottom-[4.75rem] flex min-h-12 w-full items-center justify-center rounded-[5px] border border-amber bg-amber px-5 py-2 text-sm font-bold text-ink lg:static lg:ml-auto lg:w-fit" href="/actividades/nueva">＋ Nueva actividad</Link>
  </>;
}
