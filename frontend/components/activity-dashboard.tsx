"use client";
import Link from "next/link";
import { useState } from "react";
import { ActivityCard, formatActivityDates } from "@/components/activity-card";
import { ActivityTable } from "@/components/activity-table";
import { Card } from "@/components/card";
import { MonthStrip, months } from "@/components/month-strip";
import { StatusPill } from "@/components/status-pill";
import { SummaryTile } from "@/components/summary-tile";
import { SystemIcon } from "@/components/system-icon";
import {
  canViewActivity,
  type SimulatedActivity,
  useSimulatedActivities,
} from "@/lib/activity-simulation";
import { safeMaterialUrl } from "@/lib/external-link";
import type { Activity } from "@/lib/activities";
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
  return item.spans.some(
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
    for (const span of activity.spans) {
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
}: {
  activities: SimulatedActivity[];
  role: Role;
  selected?: string;
  onSelect: (activity: Activity) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const filtered = activities.filter(
    (item) =>
      (!query.trim() ||
        `${item.title} ${item.type} ${item.responsible}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())) &&
      (!status || item.status === status),
  );
  return (
    <Card className="overflow-hidden shadow-[var(--shadow-2)]">
      <header className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title text-xl">Actividad reciente</h2>
          <p className="mt-2 text-xs text-ink-muted">
            {filtered.length} de {activities.length} actividades visibles
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar actividad"
              type="search"
              value={query}
            />
          </label>
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select
              className="min-h-10 w-full rounded-md border border-line bg-white px-3 text-xs outline-none focus:border-cyan"
              onChange={(event) => setStatus(event.target.value)}
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
              />
            ))}
          </div>
          <ActivityTable
            activities={filtered}
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

function ActivityPreview({ item }: { item: SimulatedActivity | undefined }) {
  if (!item)
    return (
      <Card className="p-5 text-sm text-ink-muted">
        Selecciona una actividad para ver su detalle.
      </Card>
    );
  const url = safeMaterialUrl(item.materialLink);
  return (
    <Card className="sticky top-6 overflow-hidden shadow-[var(--shadow-2)]">
      <div className="h-1 bg-gradient-to-r from-cyan via-cyan to-lime" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="data-label text-cyan-ink">
            {item.type}
            {item.origin === "burson" ? " · Burson" : ""}
          </p>
          <StatusPill status={item.status} />
        </div>
        <h2 className="display-title mt-3 text-[1.35rem] leading-tight">
          {item.title}
        </h2>
        <dl className="mt-5 grid grid-cols-[6rem_1fr] gap-3 border-y border-line py-4 text-xs">
          <dt className="font-bold">Responsable</dt>
          <dd>{item.responsible}</dd>
          <dt className="font-bold">Fechas</dt>
          <dd>{formatActivityDates(item)}</dd>
          <dt className="font-bold">Origen</dt>
          <dd>{item.origin === "burson" ? "Burson" : "Ordinaria"}</dd>
        </dl>
        <section className="py-4">
          <h3 className="text-xs font-extrabold">Descripción</h3>
          <p className="mt-2 text-xs leading-5 text-ink-muted">
            {item.description}
          </p>
        </section>
        {item.operatorOpinion && (
          <section className="border-t border-line py-4">
            <h3 className="text-xs font-extrabold">Opinión del operario</h3>
            <p className="mt-2 rounded-md bg-panel-secondary p-3 text-xs leading-5 text-ink-muted">
              {item.operatorOpinion}
            </p>
          </section>
        )}
        <div className="grid gap-2">
          <Link
            className="action-surface flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-extrabold text-[#173000]"
            href={`/actividades/${item.id}`}
          >
            Abrir ficha completa
          </Link>
          {url && (
            <a
              className="text-center text-xs font-bold text-[#08718a] underline decoration-cyan underline-offset-4"
              href={url}
              rel="noreferrer"
              target="_blank"
            >
              Abrir material ↗
            </a>
          )}
        </div>
      </div>
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
  const allActivities = sourceActivities.filter(
    (item) => !item.deletedAt && canViewActivity(item, role),
  );
  const period = currentLimaPeriod();
  const [selectedMonth, setSelectedMonth] = useState(period.month);
  const [selectedYear, setSelectedYear] = useState(period.year);
  const years = activityYears(allActivities, period.year);
  const activities = allActivities.filter((item) =>
    touchesMonth(item, selectedMonth, selectedYear),
  );
  const count = (status: string) =>
    activities.filter((item) => item.status === status).length;
  const monthCounts = months.map(
    (_, month) =>
      allActivities.filter((item) => touchesMonth(item, month, selectedYear))
        .length,
  );
  const [selectedId, setSelectedId] = useState(activities[0]?.id ?? "");
  const selected =
    activities.find((item) => item.id === selectedId) ?? activities[0];

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
            onChange={(event) => setSelectedYear(Number(event.target.value))}
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
        onSelect={setSelectedMonth}
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
          iconClassName="bg-orange text-night"
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
            activities={activities}
            onSelect={() => undefined}
            role={role}
          />
        </div>
      ) : (
        <div className="md:grid md:grid-cols-1 md:items-start md:gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <DashboardTable
            activities={activities}
            onSelect={(item) => setSelectedId(item.id)}
            role={role}
            selected={selected?.id}
          />
          <aside className="mt-4 hidden md:block xl:mt-0">
            <ActivityPreview item={selected} />
          </aside>
        </div>
      )}
    </>
  );
}
