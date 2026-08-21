"use client";
import Link from "next/link";
import { ActivityCard } from "@/components/activity-card";
import { ActivityTable } from "@/components/activity-table";
import { MonthStrip, months } from "@/components/month-strip";
import { SummaryTile } from "@/components/summary-tile";
import { SystemIcon } from "@/components/system-icon";
import { canViewActivity, useSimulatedActivities } from "@/lib/activity-simulation";
import type { Role } from "@/lib/roles";

export function ActivityDashboard({ role }: { role: Role }) {
  const activities = useSimulatedActivities().filter((item) => !item.deletedAt && canViewActivity(item, role));
  const count = (status: string) => activities.filter((item) => item.status === status).length;
  const monthCounts = months.map((_, month) => activities.filter((item) => item.spans.some((span) => Number(span.start.slice(5, 7)) - 1 === month)).length);
  return <>
    <MonthStrip activeMonth="AGO" counts={monthCounts} />
    <section aria-label="Resumen de actividades" className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:gap-4">
      <SummaryTile detail="Actividad visible" icon={<SystemIcon className="size-5" name="activities" />} iconClassName="bg-cyan text-night" label="Total" value={activities.length} />
      <SummaryTile detail="Por iniciar" icon={<SystemIcon className="size-5" name="calendar" />} iconClassName="bg-violet text-white" label="Programadas" value={count("Programada")} />
      <SummaryTile detail="Trabajo activo" icon={<SystemIcon className="size-5" name="progress" />} iconClassName="bg-orange text-night" label="En proceso" value={count("En proceso")} />
      <SummaryTile detail="Con material" icon={<SystemIcon className="size-5" name="complete" />} iconClassName="bg-lime text-night" label="Entregadas" value={count("Entregada")} />
    </section>
    <section className="space-y-3"><div className="flex items-end justify-between gap-4"><div><p className="text-[0.625rem] font-extrabold uppercase tracking-[0.18em] text-cyan">Seguimiento operativo</p><h2 className="section-title mt-1 text-xl">Actividades recientes</h2></div><span className="shrink-0 text-xs font-semibold text-ink-muted">{activities.length} actividades</span></div>{activities.length ? <><div className="space-y-2 lg:hidden">{activities.map((item) => <ActivityCard activity={item} key={item.id} showResponsible={role.seesAllActivities} />)}</div><ActivityTable activities={activities} showResponsible={role.seesAllActivities} /></> : <p className="rounded-[10px] border border-line bg-panel p-8 text-center text-sm text-ink-muted">Todavía no hay actividades para esta cuenta.</p>}</section>
    {role.id === "operario" && <Link className="sticky bottom-[4.75rem] flex min-h-12 items-center justify-center rounded-md bg-lime px-5 text-sm font-extrabold text-night shadow-[0_8px_22px_rgba(132,214,0,0.25)] lg:static lg:ml-auto lg:w-fit" href="/actividades/nueva">＋ Nueva actividad</Link>}
  </>;
}
