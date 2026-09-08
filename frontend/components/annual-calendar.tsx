"use client";
import { useMemo, type RefObject } from "react";
import { formatActivitySpans } from "@/components/activity-card";
import { ActivityJourneys } from "@/components/activity-journeys";
import { spanPlace } from "@/lib/activities";
import { StatusPill } from "@/components/status-pill";
import { isOverdue, useSimulatedActivities } from "@/lib/activity-simulation";
import type { DataSource } from "@/lib/data-source";
import { safeMaterialUrl } from "@/lib/external-link";
import type { HistoricalActivity, HistoricalCategory } from "@/lib/historical";
import { AnnualCalendarView } from "@/components/annual-calendar-view";

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


export function AnnualCalendar({category,dataSource,initialActivities=[],today,year}: {
  category?:HistoricalCategory;dataSource:DataSource;initialActivities?:HistoricalActivity[];today:string;year:number;
}) {
  const stored=useSimulatedActivities(dataSource==="demo");
  const all=useMemo(()=>dataSource==="demo"?stored.filter(item=>!item.deletedAt):initialActivities,[dataSource,stored,initialActivities]);
  return <AnnualCalendarView category={category} activities={all} today={today} year={year} renderDetail={(props)=>{
    const item=all.find(candidate=>candidate.id===props.item.id);
    if(!item) return null;
    return <DetailPanel {...props} item={item} choices={all.filter(candidate=>props.choices.some(choice=>choice.id===candidate.id))} onChoose={props.onChoose}/>;
  }}/>;
}
