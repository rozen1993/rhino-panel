"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDashboardFilters } from "@/lib/use-dashboard-filters";
import { ActivityCard } from "@/components/activity-card";
import { ActivityPreview } from "@/components/activity-preview";
import { ActivityTable } from "@/components/activity-table";
import { Card } from "@/components/card";
import { MonthStrip, months } from "@/components/month-strip";
import { SummaryTile } from "@/components/summary-tile";
import { SystemIcon } from "@/components/system-icon";
import {
  canViewActivity,
  type SimulatedActivity,
  useSimulatedActivities,
} from "@/lib/activity-simulation";
import type { Activity } from "@/lib/activities";
import { effectiveSpans } from "@/lib/activities";
import type { DataSource } from "@/lib/data-source";
import type { Role } from "@/lib/roles";

export function touchesMonth(
  item: SimulatedActivity,
  month: number,
  year: number,
) {
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(year, month + 1, 0))
    .toISOString()
    .slice(0, 10);
  return effectiveSpans(item).some(
    (span) => span.start <= monthEnd && span.end >= monthStart,
  );
}

function currentLimaPeriod() {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    timeZone: "America/Lima",
    year: "numeric",
  }).formatToParts(new Date());
  const value = (type: "month" | "year") =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    month: Math.max(0, Math.min(11, value("month") - 1)),
    year: Math.max(2026, value("year")),
  };
}

export function activityYears(
  activities: readonly SimulatedActivity[],
  currentYear: number,
) {
  const years = new Set<number>([Math.max(2026, currentYear)]);
  for (const activity of activities)
    for (const span of effectiveSpans(activity)) {
      const start = Number(span.start.slice(0, 4));
      const end = Number(span.end.slice(0, 4));
      if (!Number.isInteger(start) || !Number.isInteger(end)) continue;
      for (let year = Math.max(2026, start); year <= end; year += 1)
        years.add(year);
    }
  return [...years].sort((left, right) => left - right);
}

function DashboardTable({
  activities,
  role,
  selected,
  onSelect,
  query, status, onFilter, total, returnTo,
}: {
  activities: SimulatedActivity[];
  role: Role;
  selected?: string;
  onSelect: (activity: Activity) => void;
  query: string; status: string;
  onFilter: (patch: { query?: string; status?: string }) => void;
  total: number; returnTo: string;
}) {
  const filtered = activities;
  return (
    <Card className="overflow-hidden shadow-[var(--shadow-2)]">
      <header className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title text-xl">Actividad reciente</h2>
          <p className="mt-2 text-xs text-ink-muted">
            {filtered.length} de {total} actividades visibles
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_9.5rem]">
          <label className="relative">
            <span className="sr-only">Buscar actividad</span>
            <SystemIcon
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              name="search"
            />
            <input
              className="min-h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-xs outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/15"
              onChange={(event) => onFilter({query: event.target.value})}
              placeholder="Buscar actividad"
              type="search"
              value={query}
            />
          </label>
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select
              className="min-h-10 w-full rounded-md border border-line bg-white px-3 text-xs outline-none focus:border-cyan"
              onChange={(event) => onFilter({status: event.target.value})}
              value={status}
            >
              <option value="">Todos los estados</option>
              <option>Programada</option>
              <option>En proceso</option>
              <option>Entregada</option>
            </select>
          </label>
        </div>
      </header>
      {filtered.length ? (
        <>
          <div className="space-y-2 bg-paper/60 p-3 md:hidden">
            {filtered.map((item) => (
              <ActivityCard
                activity={item}
                key={item.id}
                showResponsible={role.seesAllActivities}
                returnTo={returnTo}
                onSelect={role.id === "admin" ? onSelect : undefined}
              />
            ))}
          </div>
          <ActivityTable
            activities={filtered}
            returnTo={returnTo}
            onSelect={role.id === "admin" ? onSelect : undefined}
            selectedId={selected}
            showResponsible={role.seesAllActivities}
          />
        </>
      ) : (
        <p className="border-t border-line p-8 text-center text-sm text-ink-muted">
          No hay actividades que coincidan con la búsqueda.
        </p>
      )}
    </Card>
  );
}

export function ActivityDashboard({
  role,
  dataSource = "demo",
  initialActivities = [],
}: {
  role: Role;
  dataSource?: DataSource;
  initialActivities?: SimulatedActivity[];
}) {
  const simulatedActivities = useSimulatedActivities(dataSource === "demo");
  const sourceActivities =
    dataSource === "supabase" ? initialActivities : simulatedActivities;
  const allActivities = useMemo(() => sourceActivities.filter(
    (item) => !item.deletedAt && canViewActivity(item, role),
  ), [sourceActivities, role]);
  const period = currentLimaPeriod();
  const {filters, change, returnTo} = useDashboardFilters(period);
  const {month: selectedMonth, year: selectedYear, query, status} = filters;
  const years = useMemo(() => [...new Set([...activityYears(allActivities, period.year), selectedYear])].sort((a,b)=>a-b), [allActivities, period.year, selectedYear]);
  const activities = useMemo(() => allActivities.filter((item) =>
    touchesMonth(item, selectedMonth, selectedYear),
  ), [allActivities, selectedMonth, selectedYear]);
  const count = (status: string) =>
    activities.filter((item) => item.status === status).length;
  const monthCounts = useMemo(() => months.map(
    (_, month) =>
      allActivities.filter((item) => touchesMonth(item, month, selectedYear))
        .length,
  ), [allActivities, selectedYear]);
  const filtered = activities.filter(item =>
    (!query.trim() || `${item.title} ${item.type} ${item.responsible}`.toLowerCase().includes(query.trim().toLowerCase())) &&
    (!status || item.status === status));
  const [selectedId, setSelectedId] = useState("");
  const [quickView, setQuickView] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  function selectActivity(item: Activity) {
    setSelectedId(item.id);
    if (!window.matchMedia("(min-width: 1440px)").matches) {
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setQuickView(true);
    }
  }
  useEffect(() => {
    if (!quickView) return;
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; trigger.current?.focus({preventScroll:true}); };
  }, [quickView]);
  const selected =
    filtered.find((item) => item.id === selectedId) ?? filtered[0];

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-panel px-4 py-3 shadow-[var(--shadow-1)]">
        <div>
          <p className="data-label text-cyan-ink">Periodo operativo</p>
          <p className="mt-1 text-xs text-ink-muted">
            Consulta el año actual o actividades planificadas a futuro.
          </p>
        </div>
        <label className="text-xs font-extrabold">
          <span className="sr-only">Año de actividades</span>
          <select
            aria-label="Año de actividades"
            className="min-h-10 rounded-md border border-line bg-white px-3 outline-none focus:border-cyan"
            onChange={(event) => change({year: Number(event.target.value)})}
            value={selectedYear}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>
      <MonthStrip
        activeMonth={months[selectedMonth]}
        counts={monthCounts}
        onSelect={month => change({month})}
        year={selectedYear}
      />
      <section
        aria-label="Resumen de actividades"
        className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:gap-3"
      >
        <SummaryTile
          detail="Actividad visible"
          icon={<SystemIcon className="size-5" name="activities" />}
          iconClassName="bg-cyan text-night"
          label="Actividades"
          value={activities.length}
        />
        <SummaryTile
          detail="Por iniciar"
          icon={<SystemIcon className="size-5" name="calendar" />}
          iconClassName="bg-violet text-white"
          label="Programadas"
          value={count("Programada")}
        />
        <SummaryTile
          detail="Trabajo activo"
          icon={<SystemIcon className="size-5" name="progress" />}
          iconClassName="bg-process text-white"
          label="En proceso"
          value={count("En proceso")}
        />
        <SummaryTile
          detail="Con material"
          icon={<SystemIcon className="size-5" name="complete" />}
          iconClassName="bg-lime text-night"
          label="Entregadas"
          value={count("Entregada")}
        />
      </section>
      {role.id === "operario" ? (
        <div className="space-y-3">
          <Card className="flex flex-col gap-3 border-cyan/25 bg-cyan/[.045] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="data-label text-cyan-ink">Planificación protegida</p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                Admin planifica y asigna. Tú actualizas la ejecución de cada
                actividad desde su ficha.
              </p>
            </div>
            {role.canCreateOwnActivities && (
              <Link
                className="action-surface inline-flex min-h-11 shrink-0 items-center justify-center rounded-md px-4 text-xs font-extrabold text-[#173000]"
                href="/actividades/nueva"
              >
                Crear actividad propia
              </Link>
            )}
          </Card>
          <DashboardTable
            activities={filtered}
            query={query} status={status} onFilter={change} total={activities.length} returnTo={returnTo}
            onSelect={() => undefined}
            role={role}
          />
        </div>
      ) : (
        <div className="grid items-start gap-4 min-[1440px]:grid-cols-[minmax(0,1fr)_20rem]">
          <DashboardTable
            activities={filtered}
            query={query} status={status} onFilter={change} total={activities.length} returnTo={returnTo}
            onSelect={selectActivity}
            role={role}
            selected={selected?.id}
          />
          <aside aria-label="Resumen de actividad" className="sticky top-6 hidden min-w-0 min-[1440px]:block">
            <ActivityPreview item={selected} returnTo={returnTo} />
          </aside>
          {quickView && <dialog ref={dialog} className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none overflow-hidden rounded-t-xl border border-line bg-panel p-0 shadow-xl backdrop:bg-night/50 sm:inset-0 sm:m-auto sm:w-[420px] sm:rounded-xl" aria-label="Vista rápida de actividad" onCancel={event => {event.preventDefault();setQuickView(false);}}>
            <header className="flex items-center justify-between border-b border-line px-5 py-3"><strong className="text-sm">Resumen de actividad</strong><button type="button" className="min-h-10 rounded-md border border-line px-3 text-sm" onClick={() => setQuickView(false)}>Cerrar resumen</button></header>
            <div className="[&>div]:max-h-[calc(90dvh-4.5rem)]"><ActivityPreview item={selected} returnTo={returnTo}/></div>
          </dialog>}
        </div>
      )}
    </>
  );
}
