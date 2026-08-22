"use client";

import { useMemo, useState } from "react";
import { formatActivitySpans } from "@/components/activity-card";
import { StatusPill } from "@/components/status-pill";
import {
  isOverdue,
  type SimulatedActivity,
  useSimulatedActivities,
} from "@/lib/activity-simulation";
import { safeMaterialUrl } from "@/lib/external-link";
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
    range: "bg-cyan/20 text-blue",
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
    solid: "bg-violet text-white",
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
function datesFor(item: SimulatedActivity) {
  const result = new Set<string>();
  for (const span of item.spans) {
    const cursor = utcDate(span.start);
    const end = utcDate(span.end);
    while (cursor <= end) {
      result.add(isoDate(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return result;
}

function DetailPanel({
  item,
  choices,
  onChoose,
  close,
}: {
  item: SimulatedActivity;
  choices: SimulatedActivity[];
  onChoose: (item: SimulatedActivity) => void;
  close?: () => void;
}) {
  const url = safeMaterialUrl(item.materialLink);
  return (
    <aside
      aria-label="Detalle de actividad"
      className="relative h-full overflow-y-auto bg-panel p-5 shadow-2xl xl:p-6 xl:shadow-none"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan to-lime" />
      {close && (
        <button
          aria-label="Cerrar detalle"
          className="float-right grid min-h-11 min-w-11 place-items-center rounded-full bg-panel-secondary text-xl"
          onClick={close}
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
                aria-pressed={choice.id === item.id}
                className={`rounded-md border px-3 py-2 text-left text-xs font-bold ${choice.id === item.id ? "border-cyan bg-cyan/10 text-cyan-ink" : "border-line bg-white hover:border-cyan/50"}`}
                key={choice.id}
                onClick={() => onChoose(choice)}
                type="button"
              >
                {choice.type} · {choice.title}
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
          id="activity-detail-title"
        >
          {item.title}
        </h2>
      </div>
      {isOverdue(item) && (
        <p className="mt-3 inline-flex rounded-md border border-red/30 bg-red/5 px-2 py-1 text-xs font-bold text-red">
          Actividad atrasada
        </p>
      )}
      <dl className="mt-5 grid grid-cols-[6.5rem_1fr] gap-3 border-y border-line py-5 text-sm">
        <dt className="data-label text-ink-muted">Responsable</dt>
        <dd className="font-bold">{item.responsible}</dd>
        <dt className="data-label text-ink-muted">Fechas</dt>
        <dd className="font-bold">{formatActivitySpans(item)}</dd>
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
          Abrir OneDrive ↗
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
  items,
  onSelect,
  selectedId,
}: {
  year: number;
  month: number;
  items: SimulatedActivity[];
  onSelect: (items: SimulatedActivity[]) => void;
  selectedId?: string;
}) {
  const first = new Date(Date.UTC(year, month, 1));
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const indexed = useMemo(
    () => items.map((item) => ({ item, dates: datesFor(item) })),
    [items],
  );
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
  const monthTotal = items.filter((item) =>
    item.spans.some((span) => span.start <= monthEnd && span.end >= monthStart),
  ).length;
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
          const matches = indexed.filter((entry) => entry.dates.has(iso));
          if (!matches.length)
            return (
              <span
                className="flex min-h-6 items-center justify-center"
                key={iso}
              >
                {day}
              </span>
            );
          const found = matches[0];
          const previous = utcDate(iso);
          previous.setUTCDate(previous.getUTCDate() - 1);
          const next = utcDate(iso);
          next.setUTCDate(next.getUTCDate() + 1);
          const before = found.dates.has(isoDate(previous));
          const after = found.dates.has(isoDate(next));
          const selected = matches.some(
            (entry) => entry.item.id === selectedId,
          );
          return (
            <button
              aria-label={`${day} de ${monthNames[month].toLowerCase()}: ${matches.map((entry) => `${entry.item.type}, ${entry.item.title}`).join("; ")}`}
              className={`relative flex min-h-6 items-center justify-center font-extrabold focus:z-10 ${colors[found.item.type][before || after ? "range" : "solid"]} ${before ? "rounded-l-none" : "rounded-l-full"} ${after ? "rounded-r-none" : "rounded-r-full"} ${selected ? "z-[1] ring-2 ring-night ring-offset-1" : ""}`}
              key={iso}
              onClick={() => onSelect(matches.map((entry) => entry.item))}
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
              {matches.some((entry) => isOverdue(entry.item)) && (
                <span
                  aria-label="Atrasada"
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

export function AnnualCalendar() {
  const stored = useSimulatedActivities();
  const all = useMemo(() => stored.filter((item) => !item.deletedAt), [stored]);
  const years = all
    .flatMap((item) => item.spans.map((span) => Number(span.start.slice(0, 4))))
    .filter(Boolean);
  const [year, setYear] = useState(
    years.includes(2026) ? 2026 : new Date().getFullYear(),
  );
  const visible = useMemo(
    () =>
      all.filter((item) =>
        item.spans.some(
          (span) =>
            Number(span.start.slice(0, 4)) <= year &&
            Number(span.end.slice(0, 4)) >= year,
        ),
      ),
    [all, year],
  );
  const [selectedId, setSelectedId] = useState(visible[0]?.id ?? "");
  const [choiceIds, setChoiceIds] = useState<string[]>(
    visible[0] ? [visible[0].id] : [],
  );
  const [overlay, setOverlay] = useState(false);
  const selected =
    visible.find((item) => item.id === selectedId) ?? visible[0] ?? null;
  const selectedChoices = choiceIds
    .map((id) => visible.find((item) => item.id === id))
    .filter((item): item is SimulatedActivity => Boolean(item));
  const choices = selectedChoices.length
    ? selectedChoices
    : selected
      ? [selected]
      : [];

  function select(items: SimulatedActivity[]) {
    setChoiceIds(items.map((item) => item.id));
    setSelectedId(items[0]?.id ?? "");
    setOverlay(true);
  }

  return (
    <div className="items-start overflow-hidden rounded-[10px] border border-line bg-panel shadow-[var(--shadow-2)] md:grid md:grid-cols-[minmax(0,1fr)_42%] xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="min-w-0 bg-paper p-3 md:p-5">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="data-label text-cyan-ink">
              Archivo operativo · {visible.length} registros
            </p>
            <h1 className="section-title mt-1 text-2xl md:text-3xl">
              Histórico {year}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Todas las actividades del año en una sola vista
            </p>
          </div>
          <div className="flex items-center overflow-hidden rounded-full border border-line bg-panel shadow-[var(--shadow-1)]">
            <button
              aria-label="Año anterior"
              className="min-h-11 min-w-11 text-xl transition hover:bg-panel-secondary"
              onClick={() => {
                setOverlay(false);
                setYear((value) => value - 1);
              }}
              type="button"
            >
              ‹
            </button>
            <strong className="border-x border-line px-5 py-3 tabular-nums">
              {year}
            </strong>
            <button
              aria-label="Año siguiente"
              className="min-h-11 min-w-11 text-xl transition hover:bg-panel-secondary"
              onClick={() => {
                setOverlay(false);
                setYear((value) => value + 1);
              }}
              type="button"
            >
              ›
            </button>
          </div>
        </header>
        <div
          aria-label="Leyenda de tipos"
          className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[8px] border border-line bg-panel p-3 text-xs shadow-[var(--shadow-1)]"
        >
          {Object.entries(colors).map(([type, value]) => (
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
        <div className="mt-4 grid gap-2 xl:grid-cols-4">
          {monthNames.map((_, month) => (
            <MiniMonth
              items={visible}
              key={month}
              month={month}
              onSelect={select}
              selectedId={selected?.id}
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
          />
        ) : (
          <p className="p-6 text-sm text-ink-muted">
            No hay actividades registradas en {year}.
          </p>
        )}
      </div>
      {overlay && selected && (
        <div
          aria-labelledby="activity-detail-title"
          aria-modal="true"
          autoFocus
          className="fixed inset-0 z-[60] bg-night/55 backdrop-blur-[2px] md:hidden"
          onClick={() => setOverlay(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOverlay(false);
          }}
          role="dialog"
          tabIndex={-1}
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-hidden rounded-t-[18px]"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="absolute left-1/2 top-2 z-10 h-1 w-20 -translate-x-1/2 rounded-full bg-status-gray" />
            <DetailPanel
              choices={choices}
              close={() => setOverlay(false)}
              item={selected}
              onChoose={(item) => setSelectedId(item.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
