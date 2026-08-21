"use client";
import Link from "next/link";
import { useState } from "react";
import { ActivityCard, formatActivityDates } from "@/components/activity-card";
import { ActivityForm } from "@/components/activity-form";
import { ActivityTable } from "@/components/activity-table";
import { Card } from "@/components/card";
import { MonthStrip, months } from "@/components/month-strip";
import { StatusPill } from "@/components/status-pill";
import { SummaryTile } from "@/components/summary-tile";
import { SystemIcon } from "@/components/system-icon";
import { canViewActivity, type SimulatedActivity, useSimulatedActivities } from "@/lib/activity-simulation";
import { safeMaterialUrl } from "@/lib/external-link";
import type { Activity } from "@/lib/activities";
import type { Role } from "@/lib/roles";

function touchesMonth(item: SimulatedActivity, month: number, year = 2026) {
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
  return item.spans.some((span) => span.start <= monthEnd && span.end >= monthStart);
}

function DashboardTable({ activities, role, selected, onSelect }: { activities: SimulatedActivity[]; role: Role; selected?: string; onSelect: (activity: Activity) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const filtered = activities.filter((item) => (!query.trim() || `${item.title} ${item.type} ${item.responsible}`.toLowerCase().includes(query.trim().toLowerCase())) && (!status || item.status === status));
  return <Card className="overflow-hidden shadow-[var(--shadow-2)]"><header className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="section-title text-xl">Actividad reciente</h2><p className="mt-2 text-xs text-ink-muted">{filtered.length} de {activities.length} actividades visibles</p></div><div className="grid grid-cols-[1fr_9.5rem] gap-2"><label className="relative"><span className="sr-only">Buscar actividad</span><SystemIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" name="search" /><input className="min-h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-xs outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/15" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar actividad" type="search" value={query} /></label><label><span className="sr-only">Filtrar por estado</span><select className="min-h-10 w-full rounded-md border border-line bg-white px-3 text-xs outline-none focus:border-cyan" onChange={(event) => setStatus(event.target.value)} value={status}><option value="">Todos los estados</option><option>Programada</option><option>En proceso</option><option>Entregada</option></select></label></div></header>{filtered.length ? <><div className="space-y-2 bg-paper/60 p-3 lg:hidden">{filtered.map((item) => <ActivityCard activity={item} key={item.id} showResponsible={role.seesAllActivities} />)}</div><ActivityTable activities={filtered} onSelect={role.id === "admin" ? onSelect : undefined} selectedId={selected} showResponsible={role.seesAllActivities} /></> : <p className="border-t border-line p-8 text-center text-sm text-ink-muted">No hay actividades que coincidan con la búsqueda.</p>}</Card>;
}

function ActivityPreview({ item }: { item: SimulatedActivity | undefined }) {
  if (!item) return <Card className="p-5 text-sm text-ink-muted">Selecciona una actividad para ver su detalle.</Card>;
  const url = safeMaterialUrl(item.materialLink);
  return <Card className="sticky top-6 overflow-hidden shadow-[var(--shadow-2)]"><div className="h-1 bg-gradient-to-r from-cyan via-cyan to-lime" /><div className="p-5"><div className="flex items-start justify-between gap-3"><p className="data-label text-cyan-ink">{item.type}{item.origin === "burson" ? " · Burson" : ""}</p><StatusPill status={item.status} /></div><h2 className="display-title mt-3 text-[1.35rem] leading-tight">{item.title}</h2><dl className="mt-5 grid grid-cols-[6rem_1fr] gap-3 border-y border-line py-4 text-xs"><dt className="font-bold">Responsable</dt><dd>{item.responsible}</dd><dt className="font-bold">Fechas</dt><dd>{formatActivityDates(item)}</dd><dt className="font-bold">Origen</dt><dd>{item.origin === "burson" ? "Burson" : "Operario"}</dd></dl><section className="py-4"><h3 className="text-xs font-extrabold">Descripción</h3><p className="mt-2 text-xs leading-5 text-ink-muted">{item.description}</p></section>{item.operatorOpinion && <section className="border-t border-line py-4"><h3 className="text-xs font-extrabold">Opinión del operario</h3><p className="mt-2 rounded-md bg-panel-secondary p-3 text-xs leading-5 text-ink-muted">{item.operatorOpinion}</p></section>}<div className="grid gap-2"><Link className="action-surface flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-extrabold text-[#173000]" href={`/actividades/${item.id}`}>Abrir ficha completa</Link>{url && <a className="text-center text-xs font-bold text-[#08718a] underline decoration-cyan underline-offset-4" href={url} rel="noreferrer" target="_blank">Abrir OneDrive ↗</a>}</div></div></Card>;
}

export function ActivityDashboard({ role }: { role: Role }) {
  const activities = useSimulatedActivities().filter((item) => !item.deletedAt && canViewActivity(item, role));
  const count = (status: string) => activities.filter((item) => item.status === status).length;
  const monthCounts = months.map((_, month) => activities.filter((item) => touchesMonth(item, month)).length);
  const [selectedId, setSelectedId] = useState(activities[0]?.id ?? "");
  const selected = activities.find((item) => item.id === selectedId) ?? activities[0];

  return <>
    <MonthStrip activeMonth="AGO" counts={monthCounts} />
    <section aria-label="Resumen de actividades" className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:gap-3"><SummaryTile detail="Actividad visible" icon={<SystemIcon className="size-5" name="activities" />} iconClassName="bg-cyan text-night" label="Actividades" value={activities.length} /><SummaryTile detail="Por iniciar" icon={<SystemIcon className="size-5" name="calendar" />} iconClassName="bg-violet text-white" label="Programadas" value={count("Programada")} /><SummaryTile detail="Trabajo activo" icon={<SystemIcon className="size-5" name="progress" />} iconClassName="bg-orange text-night" label="En proceso" value={count("En proceso")} /><SummaryTile detail="Con material" icon={<SystemIcon className="size-5" name="complete" />} iconClassName="bg-lime text-night" label="Entregadas" value={count("Entregada")} /></section>
    {role.id === "operario" ? <div className="xl:grid xl:grid-cols-[25rem_minmax(0,1fr)] xl:items-start xl:gap-4"><div className="hidden xl:block"><ActivityForm compact role={role} /></div><DashboardTable activities={activities} onSelect={() => undefined} role={role} /></div> : <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-4"><DashboardTable activities={activities} onSelect={(item) => setSelectedId(item.id)} role={role} selected={selected?.id} /><aside className="mt-4 hidden xl:block xl:mt-0"><ActivityPreview item={selected} /></aside></div>}
    {role.id === "operario" && <Link className="action-surface sticky bottom-[4.75rem] z-10 flex min-h-12 items-center justify-center rounded-md px-5 text-sm font-extrabold text-[#173000] shadow-[0_10px_24px_rgba(95,170,0,.28)] md:static md:ml-auto md:w-fit xl:hidden" href="/actividades/nueva">＋ Nueva actividad</Link>}
  </>;
}
