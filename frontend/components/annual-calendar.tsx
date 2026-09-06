"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { formatActivitySpans } from "@/components/activity-card";
import { ActivityJourneys } from "@/components/activity-journeys";
import { spanPlace } from "@/lib/activities";
import { StatusPill } from "@/components/status-pill";
import { isOverdue, useSimulatedActivities } from "@/lib/activity-simulation";
import type { DataSource } from "@/lib/data-source";
import { safeMaterialUrl } from "@/lib/external-link";
import {
  activityOverlapsYear,
  historicalYearCeiling,
  historicalYearFloor,
  historicalCategorySlug,
  type HistoricalCategory,
  type HistoricalActivity,
} from "@/lib/historical";
import type { ActivityType } from "@/lib/roles";

const monthNames = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];
const weekdays = [
  { short: "L", label: "lunes" },
  { short: "M", label: "martes" },
  { short: "X", label: "miércoles" },
  { short: "J", label: "jueves" },
  { short: "V", label: "viernes" },
  { short: "S", label: "sábado" },
  { short: "D", label: "domingo" },
];
const colors: Record<
  ActivityType,
  { solid: string; range: string; marker: string }
> = {
  Grabación: {
    solid: "bg-cyan text-night",
    range: "bg-cyan/20 text-cyan-ink",
    marker: "bg-cyan",
  },
  Edición: {
    solid: "bg-orange text-night",
    range: "bg-orange/20 text-[#8a5200]",
    marker: "bg-orange",
  },
  Creatividad: {
    solid: "bg-lime text-night",
    range: "bg-lime/25 text-[#376300]",
    marker: "bg-lime",
  },
  Locución: {
    solid: "bg-[#7c3aed] text-white",
    range: "bg-violet/15 text-[#5b2bb5]",
    marker: "bg-violet",
  },
};

function utcDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}
function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
function datesForYear(item: HistoricalActivity, year: number) {
  const result = new Set<string>();
  const lower = new Date(Date.UTC(year, 0, 1, 12));
  lower.setUTCDate(lower.getUTCDate() - 1);
  const upper = new Date(Date.UTC(year, 11, 31, 12));
  upper.setUTCDate(upper.getUTCDate() + 1);
  for (const span of item.spans) {
    const spanStart = utcDate(span.start);
    const spanEnd = utcDate(span.end);
    if (spanEnd < lower || spanStart > upper) continue;
    const cursor = new Date(Math.max(spanStart.getTime(), lower.getTime()));
    const end = new Date(Math.min(spanEnd.getTime(), upper.getTime()));
    while (cursor <= end) {
      result.add(isoDate(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return result;
}

type IndexedActivity = {
  item: HistoricalActivity;
  dates: Set<string>;
};

function DetailPanel({
  item,
  choices,
  onChoose,
  close,
  titleId,
  closeButtonRef,
  today,
}: {
  item: HistoricalActivity;
  choices: HistoricalActivity[];
  onChoose: (item: HistoricalActivity) => void;
  close?: () => void;
  titleId: string;
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
  today: string;
}) {
  const url = safeMaterialUrl(item.materialLink);
  return (
    <aside
      aria-labelledby={titleId}
      className="relative h-full overflow-y-auto bg-panel p-5 shadow-2xl xl:p-6 xl:shadow-none"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan to-lime" />
      {close && (
        <button
          aria-label="Cerrar detalle"
          className="float-right grid min-h-11 min-w-11 place-items-center rounded-full bg-panel-secondary text-xl"
          onClick={close}
          ref={closeButtonRef}
          type="button"
        >
          ×
        </button>
      )}
      {choices.length > 1 && (
        <section
          aria-label="Actividades de esta fecha"
          className="mb-5 border-b border-line pb-4"
        >
          <p className="data-label text-ink-muted">
            {choices.length} actividades en esta fecha
          </p>
          <div className="mt-2 grid gap-1.5">
            {choices.map((choice) => (
              <button
                aria-label={`${choice.type} · ${choice.title}. ID: ${choice.id}. ${choice.responsible}. ${formatActivitySpans(choice)}. ${[...new Set(choice.spans.map((span) => spanPlace(span, choice.place) || "Sin lugar indicado"))].join("; ")}`}
                aria-pressed={choice.id === item.id}
                className={`rounded-md border px-3 py-2 text-left text-xs font-bold ${choice.id === item.id ? "border-cyan bg-cyan/10 text-cyan-ink" : "border-line bg-white hover:border-cyan/50"}`}
                key={choice.id}
                onClick={() => onChoose(choice)}
                type="button"
              >
                <span className="block">{choice.type} · {choice.title}</span>
                <span className="mt-1 block break-all font-mono text-[0.625rem] font-normal">ID: {choice.id}</span>
                <span className="block text-[0.6875rem] font-normal text-ink-muted">{choice.responsible}</span>
                <span className="block break-words text-[0.6875rem] font-normal text-ink-muted">Lugares de la actividad: {[...new Set(choice.spans.map((span) => spanPlace(span, choice.place) || "Sin lugar indicado"))].join(" · ")}</span>
                <span className="block text-[0.6875rem] font-normal text-ink-muted">{formatActivitySpans(choice)}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="pr-12">
        <StatusPill status={item.status} />
        <p className="mt-5 text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-cyan-ink">
          {item.type}
          {item.origin === "burson" ? " · Burson" : ""}
        </p>
        <h2
          className="section-title mt-1 text-xl leading-tight"
          id={titleId}
        >
          {item.title}
        </h2>
      </div>
      <p className="mt-3 break-all font-mono text-[0.625rem] text-ink-muted">ID: {item.id}</p>
      {isOverdue(item, today) && (
        <p className="mt-3 inline-flex rounded-md border border-red/30 bg-red/5 px-2 py-1 text-xs font-bold text-red">
          Actividad atrasada
        </p>
      )}
      <dl className="mt-5 grid grid-cols-[6.5rem_1fr] gap-3 border-y border-line py-5 text-sm">
        <dt className="data-label text-ink-muted">Responsable</dt>
        <dd className="font-bold">{item.responsible}</dd>
        <dt className="data-label text-ink-muted">Jornadas</dt>
        <dd className="min-w-0"><ActivityJourneys activity={item} /></dd>
        <dt className="data-label text-ink-muted">Origen</dt>
        <dd className="font-bold">
          {item.origin === "burson" ? "Burson" : "Operario"}
        </dd>
      </dl>
      <section className="border-b border-line py-5">
        <h3 className="text-sm font-extrabold">Descripción</h3>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {item.description}
        </p>
      </section>
      <section className="py-5">
        <h3 className="text-sm font-extrabold">Opinión del operario</h3>
        <p className="mt-2 rounded-md bg-panel-secondary p-3 text-sm leading-6 text-ink-muted">
          {item.operatorOpinion || "Todavía no dejó una opinión."}
        </p>
      </section>
      {url ? (
        <a
          className="flex min-h-12 items-center justify-center rounded-md bg-lime px-4 text-sm font-extrabold text-night"
          href={url}
          rel="noreferrer"
          target="_blank"
        >
          Abrir material ↗
        </a>
      ) : (
        <p className="rounded-md border border-dashed border-cyan/60 bg-cyan/5 p-3 text-center text-sm font-bold text-ink-muted">
          Enlace disponible al entregar
        </p>
      )}
    </aside>
  );
}

function MiniMonth({
  year,
  month,
  activitiesByDate,
  monthTotal,
  onSelect,
  selectedId,
  today,
}: {
  year: number;
  month: number;
  activitiesByDate: ReadonlyMap<string, IndexedActivity[]>;
  monthTotal: number;
  onSelect: (
    items: HistoricalActivity[],
    trigger: HTMLButtonElement,
  ) => void;
  selectedId?: string;
  today: string;
}) {
  const first = new Date(Date.UTC(year, month, 1));
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  return (
    <section className="group relative min-h-[13rem] rounded-[8px] border border-line bg-panel p-2.5 shadow-[0_3px_10px_rgba(3,29,54,0.035)] transition hover:-translate-y-0.5 hover:border-cyan/45 hover:shadow-[var(--shadow-2)]">
      <div className="flex items-center justify-center gap-2">
        <h3 className="text-center text-[0.6875rem] font-extrabold tracking-[0.08em] text-ink">
          {monthNames[month]}
        </h3>
        {monthTotal > 0 && (
          <span className="grid size-4 place-items-center rounded-full bg-night text-[0.5rem] font-black text-white">
            {monthTotal}
          </span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-[0.5625rem] font-bold text-ink-muted">
        {weekdays.map((day) => (
          <span aria-label={day.label} key={day.label}>
            {day.short}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-[0.625rem] sm:text-[0.6875rem]">
        {Array.from({ length: offset }, (_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const matches = activitiesByDate.get(iso) ?? [];
          if (!matches.length)
            return (
              <span
                className="flex min-h-6 items-center justify-center"
                key={iso}
              >
                {day}
              </span>
            );
          const found = matches.find((entry) => entry.item.id === selectedId) ?? matches[0];
          const previous = utcDate(iso);
          previous.setUTCDate(previous.getUTCDate() - 1);
          const next = utcDate(iso);
          next.setUTCDate(next.getUTCDate() + 1);
          const before = found.dates.has(isoDate(previous));
          const after = found.dates.has(isoDate(next));
          const selected = matches.some(
            (entry) => entry.item.id === selectedId,
          );
          const overdue = matches.some((entry) =>
            isOverdue(entry.item, today),
          );
          return (
            <button
              aria-label={`${day} de ${monthNames[month].toLowerCase()}: ${matches.map((entry) => `${entry.item.type}, ${entry.item.title}`).join("; ")}${overdue ? ". Hay una actividad atrasada." : ""}`}
              className={`relative flex min-h-6 items-center justify-center font-extrabold focus:z-10 ${colors[found.item.type][before || after ? "range" : "solid"]} ${before ? "rounded-l-none" : "rounded-l-full"} ${after ? "rounded-r-none" : "rounded-r-full"} ${selected ? "z-[1] ring-2 ring-night ring-offset-1" : ""}`}
              key={iso}
              onClick={(event) =>
                onSelect(
                  matches.map((entry) => entry.item),
                  event.currentTarget,
                )
              }
              type="button"
            >
              {day}
              {matches.length > 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-night text-[0.45rem] text-white"
                >
                  {matches.length}
                </span>
              )}
              {overdue && (
                <span
                  aria-hidden="true"
                  className="absolute -left-0.5 -top-0.5 size-1.5 rounded-full bg-red"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function AnnualCalendar({
  category,
  dataSource,
  initialActivities = [],
  today,
  year,
}: {
  category?: HistoricalCategory;
  dataSource: DataSource;
  initialActivities?: HistoricalActivity[];
  today: string;
  year: number;
}) {
  const stored = useSimulatedActivities(dataSource === "demo");
  const all = useMemo<HistoricalActivity[]>(
    () =>
      dataSource === "demo"
        ? stored.filter((item) => !item.deletedAt)
        : initialActivities,
    [dataSource, initialActivities, stored],
  );
  const visible = useMemo(
    () => all.filter((item) => (!category || item.type === category) && activityOverlapsYear(item, year)),
    [all, year, category],
  );
  const calendarIndex = useMemo(() => {
    const activitiesByDate = new Map<string, IndexedActivity[]>();
    const monthTotals = Array.from({ length: 12 }, () => 0);
    visible.forEach((item) => {
      const entry: IndexedActivity = {
        item,
        dates: datesForYear(item, year),
      };
      entry.dates.forEach((date) => {
        const matches = activitiesByDate.get(date) ?? [];
        matches.push(entry);
        activitiesByDate.set(date, matches);
      });
      monthTotals.forEach((_, month) => {
        const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
        if (
          item.spans.some(
            (span) => span.start <= end && span.end >= start,
          )
        ) {
          monthTotals[month] += 1;
        }
      });
    });
    return { activitiesByDate, monthTotals };
  }, [visible, year]);
  const [selectedId, setSelectedId] = useState(visible[0]?.id ?? "");
  const [choiceIds, setChoiceIds] = useState<string[]>(
    visible[0] ? [visible[0].id] : [],
  );
  const [overlay, setOverlay] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusPendingRef = useRef(false);
  const selected =
    visible.find((item) => item.id === selectedId) ?? visible[0] ?? null;
  const selectedChoices = choiceIds
    .map((id) => visible.find((item) => item.id === id))
    .filter((item): item is HistoricalActivity => Boolean(item));
  const choices = selectedChoices.length
    ? selectedChoices
    : selected
      ? [selected]
      : [];
  const dialogOpen = overlay && selected !== null;

  useEffect(() => {
    if (!dialogOpen) {
      if (restoreFocusPendingRef.current) {
        returnFocusRef.current?.focus();
        restoreFocusPendingRef.current = false;
      }
      return;
    }

    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleMediaChange(event: MediaQueryListEvent) {
      if (!event.matches) {
        restoreFocusPendingRef.current = true;
        setOverlay(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        restoreFocusPendingRef.current = true;
        setOverlay(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1) ?? first;
      const active = document.activeElement;
      if (!dialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    mobileQuery.addEventListener("change", handleMediaChange);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      mobileQuery.removeEventListener("change", handleMediaChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [dialogOpen]);

  function select(
    items: HistoricalActivity[],
    trigger: HTMLButtonElement,
  ) {
    setChoiceIds(items.map((item) => item.id));
    setSelectedId(items[0]?.id ?? "");
    returnFocusRef.current = trigger;
    const mobile =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(max-width: 767px)").matches
        : window.innerWidth < 768;
    setOverlay(mobile);
  }

  function closeOverlay() {
    restoreFocusPendingRef.current = true;
    setOverlay(false);
  }

  const yearControlClass =
    "grid min-h-11 min-w-11 place-items-center text-xl transition hover:bg-panel-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan";

  return (
    <div className="items-start overflow-hidden rounded-[10px] border border-line bg-panel shadow-[var(--shadow-2)] md:grid md:grid-cols-[minmax(0,1fr)_42%] xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="min-w-0 bg-paper p-3 md:p-5">
        <nav aria-label="Históricos" className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-cyan-ink">
          <Link href="/historico" className="py-2">← Elegir histórico</Link>
          {category && <Link href={{ pathname: "/historico", query: { anio: year, tipo: historicalCategorySlug(category === "Grabación" ? "Edición" : "Grabación") } }} className="py-2">Ver {category === "Grabación" ? "Edición" : "Grabación"}</Link>}
        </nav>
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="data-label text-cyan-ink">
              Archivo operativo · {visible.length} registros
            </p>
            <h1 className="section-title mt-1 text-2xl md:text-3xl">
              Histórico {year}
              {category && <span className="ml-3 inline-block rounded border border-line bg-panel px-2 py-1 align-middle font-sans text-xs font-semibold text-cyan-ink">{category}</span>}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {category ? `Todas las actividades de ${category.toLowerCase()} del año` : "Todas las actividades del año en una sola vista"}
            </p>
          </div>
          <div className="flex items-center overflow-hidden rounded-full border border-line bg-panel shadow-[var(--shadow-1)]">
            {year > historicalYearFloor ? (
              <Link
                aria-label="Año anterior"
                className={yearControlClass}
                href={{
                  pathname: "/historico",
                  query: { anio: String(year - 1), ...(category ? { tipo: historicalCategorySlug(category) } : {}) },
                }}
                scroll={false}
              >
                ‹
              </Link>
            ) : (
              <button
                aria-label="Año anterior"
                className={`${yearControlClass} cursor-not-allowed text-ink-muted opacity-45`}
                disabled
                type="button"
              >
                ‹
              </button>
            )}
            <strong className="border-x border-line px-5 py-3 tabular-nums">
              {year}
            </strong>
            {year < historicalYearCeiling ? (
              <Link
                aria-label="Año siguiente"
                className={yearControlClass}
                href={{
                  pathname: "/historico",
                  query: { anio: String(year + 1), ...(category ? { tipo: historicalCategorySlug(category) } : {}) },
                }}
                scroll={false}
              >
                ›
              </Link>
            ) : (
              <button
                aria-label="Año siguiente"
                className={`${yearControlClass} cursor-not-allowed text-ink-muted opacity-45`}
                disabled
                type="button"
              >
                ›
              </button>
            )}
          </div>
        </header>
        <div
          aria-label="Leyenda de tipos"
          className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[8px] border border-line bg-panel p-3 text-xs shadow-[var(--shadow-1)]"
        >
          {Object.entries(colors).filter(([type]) => !category || type === category).map(([type, value]) => (
            <span className="flex items-center gap-2" key={type}>
              <i
                aria-hidden="true"
                className={`size-2.5 rounded-full ${value.marker}`}
              />
              <span>{type}</span>
              <strong className="tabular-nums text-ink-muted">
                {visible.filter((item) => item.type === type).length}
              </strong>
            </span>
          ))}
        </div>
        <p className="mt-2 text-[0.6875rem] text-ink-muted">Color = categoría. Número oscuro = actividades en ese día. Pulsa la fecha para verlas todas.</p>
        {!visible.length && (
          <p
            className="mt-4 rounded-md border border-dashed border-line bg-panel p-4 text-sm text-ink-muted md:hidden"
            role="status"
          >
            No hay actividades registradas en {year}.
          </p>
        )}
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {monthNames.map((_, month) => (
            <MiniMonth
              activitiesByDate={calendarIndex.activitiesByDate}
              key={month}
              month={month}
              monthTotal={calendarIndex.monthTotals[month]}
              onSelect={select}
              selectedId={selected?.id}
              today={today}
              year={year}
            />
          ))}
        </div>
      </section>
      <div className="hidden border-l border-line md:sticky md:top-0 md:block md:h-[calc(100vh-4.5rem)]">
        {selected ? (
          <DetailPanel
            choices={choices}
            item={selected}
            onChoose={(item) => setSelectedId(item.id)}
            today={today}
            titleId="activity-detail-title-desktop"
          />
        ) : (
          <p className="p-6 text-sm text-ink-muted" role="status">
            No hay actividades registradas en {year}.
          </p>
        )}
      </div>
      {dialogOpen && selected && (
        <div
          aria-labelledby="activity-detail-title-mobile"
          aria-modal="true"
          className="fixed inset-0 z-[60] bg-night/55 backdrop-blur-[2px] md:hidden"
          onClick={closeOverlay}
          ref={dialogRef}
          role="dialog"
          tabIndex={-1}
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto overscroll-contain rounded-t-[18px] pb-[env(safe-area-inset-bottom)]"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="absolute left-1/2 top-2 z-10 h-1 w-20 -translate-x-1/2 rounded-full bg-status-gray" />
            <DetailPanel
              choices={choices}
              close={closeOverlay}
              closeButtonRef={closeButtonRef}
              item={selected}
              onChoose={(item) => setSelectedId(item.id)}
              today={today}
              titleId="activity-detail-title-mobile"
            />
          </div>
        </div>
      )}
    </div>
  );
}
