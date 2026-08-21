"use client";

import { useMemo, useState } from "react";
import { StatusPill } from "@/components/status-pill";
import { formatActivityDates } from "@/components/activity-card";
import { isOverdue, type SimulatedActivity, useSimulatedActivities } from "@/lib/activity-simulation";
import { safeMaterialUrl } from "@/lib/external-link";
import type { ActivityType } from "@/lib/roles";

const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
const weekdays = ["L", "M", "M", "J", "V", "S", "D"];
const colors: Record<ActivityType, { solid: string; range: string; marker: string }> = {
  Grabación: { solid: "bg-cyan text-night", range: "bg-cyan/20 text-blue", marker: "bg-cyan" },
  Edición: { solid: "bg-orange text-night", range: "bg-orange/20 text-[#8a5200]", marker: "bg-orange" },
  Creatividad: { solid: "bg-lime text-night", range: "bg-lime/25 text-[#376300]", marker: "bg-lime" },
  Locución: { solid: "bg-violet text-white", range: "bg-violet/15 text-violet", marker: "bg-violet" },
};

function datesFor(item: SimulatedActivity) {
  const result = new Set<string>();
  for (const span of item.spans) {
    const cursor = new Date(`${span.start}T12:00:00`);
    const end = new Date(`${span.end}T12:00:00`);
    while (cursor <= end) { result.add(cursor.toISOString().slice(0, 10)); cursor.setDate(cursor.getDate() + 1); }
  }
  return result;
}

function DetailPanel({ item, close }: { item: SimulatedActivity; close?: () => void }) {
  const url = safeMaterialUrl(item.materialLink);
  return <aside aria-label="Detalle de actividad" className="relative h-full overflow-y-auto bg-panel p-5 shadow-2xl xl:p-6 xl:shadow-none">
    <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan to-lime" />
    {close && <button aria-label="Cerrar detalle" className="float-right grid min-h-11 min-w-11 place-items-center rounded-full bg-panel-secondary text-xl" onClick={close} type="button">×</button>}
    <div className="pr-12"><StatusPill status={item.status} /><p className="mt-5 text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-cyan-ink">{item.type}{item.origin === "burson" ? " · Burson" : ""}</p><h2 className="section-title mt-1 text-xl leading-tight">{item.title}</h2></div>
    {isOverdue(item) && <p className="mt-3 inline-flex rounded-md border border-red/30 bg-red/5 px-2 py-1 text-xs font-bold text-red">Actividad atrasada</p>}
    <dl className="mt-5 grid grid-cols-[6.5rem_1fr] gap-3 border-y border-line py-5 text-sm"><dt className="data-label text-ink-muted">Responsable</dt><dd className="font-bold">{item.responsible}</dd><dt className="data-label text-ink-muted">Fechas</dt><dd className="font-bold">{formatActivityDates(item)}</dd><dt className="data-label text-ink-muted">Origen</dt><dd className="font-bold">{item.origin === "burson" ? "Burson" : "Operario"}</dd></dl>
    <section className="border-b border-line py-5"><h3 className="text-sm font-extrabold">Descripción</h3><p className="mt-2 text-sm leading-6 text-ink-muted">{item.description}</p></section>
    <section className="py-5"><h3 className="text-sm font-extrabold">Opinión del operario</h3><p className="mt-2 rounded-md bg-panel-secondary p-3 text-sm leading-6 text-ink-muted">{item.operatorOpinion || "Todavía no dejó una opinión."}</p></section>
    {url ? <a className="flex min-h-12 items-center justify-center rounded-md bg-lime px-4 text-sm font-extrabold text-night" href={url} rel="noreferrer" target="_blank">Abrir OneDrive ↗</a> : <p className="rounded-md border border-dashed border-cyan/60 bg-cyan/5 p-3 text-center text-sm font-bold text-ink-muted">Enlace disponible al entregar</p>}
  </aside>;
}

function MiniMonth({ year, month, items, onSelect, selectedId }: { year: number; month: number; items: SimulatedActivity[]; onSelect: (item: SimulatedActivity) => void; selectedId?: string }) {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const indexed = useMemo(() => items.map((item) => ({ item, dates: datesFor(item) })), [items]);
  const monthTotal = items.filter((item) => item.spans.some((span) => Number(span.start.slice(5, 7)) - 1 <= month && Number(span.end.slice(5, 7)) - 1 >= month)).length;
  return <section className="group relative min-h-[13rem] rounded-[8px] border border-line bg-panel p-2.5 shadow-[0_3px_10px_rgba(3,29,54,0.035)] transition hover:-translate-y-0.5 hover:border-cyan/45 hover:shadow-[var(--shadow-2)]">
    <div className="flex items-center justify-center gap-2"><h3 className="text-center text-[0.6875rem] font-extrabold tracking-[0.08em] text-ink">{monthNames[month]}</h3>{monthTotal > 0 && <span className="grid size-4 place-items-center rounded-full bg-night text-[0.5rem] font-black text-white">{monthTotal}</span>}</div>
    <div className="mt-2 grid grid-cols-7 text-center text-[0.5625rem] font-bold text-ink-muted">{weekdays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
    <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-[0.625rem] sm:text-[0.6875rem]">
      {Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} />)}
      {Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const found = indexed.find((entry) => entry.dates.has(iso));
        if (!found) return <span className="flex min-h-6 items-center justify-center" key={iso}>{day}</span>;
        const previous = new Date(`${iso}T12:00:00`); previous.setDate(previous.getDate() - 1);
        const next = new Date(`${iso}T12:00:00`); next.setDate(next.getDate() + 1);
        const before = found.dates.has(previous.toISOString().slice(0, 10));
        const after = found.dates.has(next.toISOString().slice(0, 10));
        return <button aria-label={`${day} de ${monthNames[month].toLowerCase()}: ${found.item.title}`} className={`relative flex min-h-6 items-center justify-center font-extrabold focus:z-10 focus:outline-2 focus:outline-cyan ${colors[found.item.type][before || after ? "range" : "solid"]} ${before ? "rounded-l-none" : "rounded-l-full"} ${after ? "rounded-r-none" : "rounded-r-full"} ${selectedId === found.item.id ? "z-[1] ring-2 ring-night ring-offset-1" : ""}`} key={iso} onClick={() => onSelect(found.item)} type="button">{day}{isOverdue(found.item) && <span aria-label="Atrasada" className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-red" />}</button>;
      })}
    </div>
  </section>;
}

export function AnnualCalendar() {
  const all = useSimulatedActivities().filter((item) => !item.deletedAt);
  const years = all.flatMap((item) => item.spans.map((span) => Number(span.start.slice(0, 4)))).filter(Boolean);
  const [year, setYear] = useState(years.includes(2026) ? 2026 : new Date().getFullYear());
  const visible = all.filter((item) => item.spans.some((span) => Number(span.start.slice(0, 4)) <= year && Number(span.end.slice(0, 4)) >= year));
  const [selected, setSelected] = useState<SimulatedActivity | null>(visible[0] ?? null);
  const [overlay, setOverlay] = useState(false);
  function select(item: SimulatedActivity) { setSelected(item); setOverlay(true); }

  return <div className="overflow-hidden rounded-[10px] border border-line bg-panel shadow-[var(--shadow-2)] md:grid md:grid-cols-[minmax(0,1fr)_42%] xl:grid-cols-[minmax(0,1fr)_20rem]">
    <section className="min-w-0 bg-paper p-3 md:p-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4"><div><p className="data-label text-cyan-ink">Archivo operativo · {visible.length} registros</p><h1 className="section-title mt-1 text-2xl md:text-3xl">Histórico {year}</h1><p className="mt-2 text-sm text-ink-muted">Todas las actividades del año en una sola vista</p></div><div className="flex items-center overflow-hidden rounded-full border border-line bg-panel shadow-[var(--shadow-1)]"><button aria-label="Año anterior" className="min-h-11 min-w-11 text-xl transition hover:bg-panel-secondary" onClick={() => setYear((value) => value - 1)} type="button">‹</button><strong className="border-x border-line px-5 py-3 tabular-nums">{year}</strong><button aria-label="Año siguiente" className="min-h-11 min-w-11 text-xl transition hover:bg-panel-secondary" onClick={() => setYear((value) => value + 1)} type="button">›</button></div></header>
      <div aria-label="Leyenda de tipos" className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[8px] border border-line bg-panel p-3 text-xs shadow-[var(--shadow-1)]">{Object.entries(colors).map(([type, value]) => <span className="flex items-center gap-2" key={type}><i className={`size-2.5 rounded-full ${value.marker}`} /><span>{type}</span><strong className="tabular-nums text-ink-muted">{visible.filter((item) => item.type === type).length}</strong></span>)}</div>
      <div className="mt-4 grid gap-2 xl:grid-cols-4">{monthNames.map((_, month) => <MiniMonth items={visible} key={month} month={month} onSelect={select} selectedId={selected?.id} year={year} />)}</div>
    </section>
    <div className="hidden border-l border-line md:block">{selected ? <DetailPanel item={selected} /> : <p className="p-6 text-sm text-ink-muted">Selecciona una fecha marcada.</p>}</div>
    {overlay && selected && <div className="fixed inset-0 z-[60] bg-night/55 backdrop-blur-[2px] md:hidden" onClick={() => setOverlay(false)}><div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-hidden rounded-t-[18px]" onClick={(event) => event.stopPropagation()}><span className="absolute left-1/2 top-2 z-10 h-1 w-20 -translate-x-1/2 rounded-full bg-status-gray" /><DetailPanel close={() => setOverlay(false)} item={selected} /></div></div>}
  </div>;
}
