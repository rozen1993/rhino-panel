"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ActivityJourneys } from "@/components/activity-journeys";
import { spanPlace } from "@/lib/activities";
import { StatusPill } from "@/components/status-pill";
import { SystemIcon } from "@/components/system-icon";
import { isOverdue, useSimulatedActivities } from "@/lib/activity-simulation";
import type { DataSource } from "@/lib/data-source";
import { safeMaterialUrl } from "@/lib/external-link";
import type { HistoricalActivity, HistoricalCategory } from "@/lib/historical";
import { AnnualCalendarView } from "@/components/annual-calendar-view";

const panelDate = new Intl.DateTimeFormat("es-PE", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
});
const secondaryAction = "min-h-11 rounded-md text-sm font-bold text-cyan-ink transition-colors hover:bg-cyan/10";

function DetailPanel({ item, choices, onChoose, close, titleId, closeButtonRef, today, selectedDate }: {
  item: HistoricalActivity;
  choices: HistoricalActivity[];
  onChoose: (item: HistoricalActivity) => void;
  close?: () => void;
  titleId: string;
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
  today: string;
  selectedDate?: string;
}) {
  const url = safeMaterialUrl(item.materialLink);
  const [showDetail, setShowDetail] = useState(false);
  const listing = choices.length > 1 && !showDetail;
  const panelRef = useRef<HTMLElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const choiceRefs = useRef(new Map<string, HTMLButtonElement>());
  const focusPending = useRef(false);
  const listScroll = useRef(0);

  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    if (panelRef.current) panelRef.current.scrollTop = listing ? listScroll.current : 0;
    (listing ? choiceRefs.current.get(item.id) : backRef.current)?.focus({ preventScroll: true });
  }, [listing, item.id]);

  return (
    <aside aria-labelledby={titleId} ref={panelRef}
      className="relative max-h-[82dvh] overflow-y-auto overscroll-contain bg-panel md:max-h-[calc(100dvh-2rem)]">
      <header className="sticky top-0 z-10 border-b border-line/30 border-t-[3px] border-t-cyan bg-panel px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {!listing && choices.length > 1 ? (
            <button type="button" ref={backRef} aria-label="Volver a las actividades del día" className={`${secondaryAction} px-2 text-left`}
              onClick={() => { focusPending.current = true; setShowDetail(false); }}>
              ← Volver
            </button>
          ) : (
            <p className="data-label text-cyan-ink">{listing ? "Actividades del día" : "Detalle de actividad"}</p>
          )}
          {close && (
            <button aria-label="Cerrar detalle" ref={closeButtonRef} type="button" onClick={close}
              className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full bg-panel-secondary text-xl hover:bg-cyan/10">
              ×
            </button>
          )}
        </div>
        {selectedDate && (
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink">
            <SystemIcon name="calendar" className="size-4 shrink-0 text-cyan-ink" />
            <time dateTime={selectedDate}>{panelDate.format(new Date(`${selectedDate}T12:00:00Z`))}</time>
          </p>
        )}
      </header>

      {listing ? (
        <section aria-label="Actividades de esta fecha" className="bg-panel-secondary p-4">
          <h2 id={titleId} className="mb-3 text-xs font-semibold text-ink-muted">
            {choices.length} actividades en esta fecha
          </h2>
          <div className="grid gap-3">
            {choices.map((choice) => {
              const places = [...new Set(choice.spans.map(span => spanPlace(span, choice.place) || "Sin lugar indicado"))].join(" · ");
              const sameTitle = choices.filter(candidate => candidate.title === choice.title).length > 1;
              return (
                <article key={choice.id} className="min-w-0 rounded-[10px] border border-line/40 bg-panel p-3.5 shadow-[var(--shadow-1)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="data-label text-cyan-ink">{choice.type}</p>
                    <StatusPill status={choice.status} />
                  </div>
                  <h3 className="display-title mt-3 break-words text-lg leading-snug text-ink">{choice.title}</h3>
                  {sameTitle && <p title={`ID: ${choice.id}`} className="mt-1 break-all font-mono text-[0.625rem] text-ink-muted">Ref. {choice.id}</p>}
                  <p className="mt-2 line-clamp-2 break-words text-sm leading-5 text-ink-muted">{choice.description}</p>
                  <div className="mt-3 grid gap-1.5 text-xs text-ink-muted">
                    <p className="flex items-center gap-2"><SystemIcon name="profile" className="size-4 shrink-0" /><span className="min-w-0 break-words font-semibold text-ink">{choice.responsible}</span></p>
                    <p className="flex items-start gap-2" title={places}><SystemIcon name="location" className="size-4 shrink-0" /><span className="line-clamp-1 break-all">{places}</span></p>
                  </div>
                  <button type="button" className={`${secondaryAction} mt-3 flex w-full items-center justify-between gap-2 border-t border-line/25 px-1 pt-2`}
                    aria-label={`Ver detalles: ${choice.type} · ${choice.title}. ID: ${choice.id}`}
                    ref={element => { if (element) choiceRefs.current.set(choice.id, element); else choiceRefs.current.delete(choice.id); }}
                    onClick={() => {
                      listScroll.current = panelRef.current?.scrollTop ?? 0;
                      focusPending.current = true;
                      onChoose(choice);
                      setShowDetail(true);
                    }}>
                    Ver detalles <span aria-hidden="true">→</span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="space-y-5 p-4" key={item.id}>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="data-label text-cyan-ink">{item.type}</p>
              <StatusPill status={item.status} />
            </div>
            <h2 className="display-title mt-3 break-words text-2xl leading-tight text-ink" id={titleId}>{item.title}</h2>
            {isOverdue(item, today) && <p className="mt-3 text-xs font-bold text-red">Actividad atrasada</p>}
          </div>

          <div className="flex items-center gap-3 rounded-[8px] bg-panel-secondary p-3">
            <SystemIcon name="profile" className="size-5 shrink-0 text-cyan-ink" />
            <div className="min-w-0"><p className="text-xs text-ink-muted">Responsable</p><p className="break-words text-sm font-bold">{item.responsible}</p></div>
          </div>
          <section>
            <h3 className="text-sm font-bold">Descripción</h3>
            <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-ink-muted">{item.description || "Sin descripción registrada."}</p>
          </section>
          <section className="border-t border-line/30 pt-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><SystemIcon name="calendar" className="size-4 text-cyan-ink" />Jornadas y lugares</h3>
            <ActivityJourneys activity={item} />
          </section>
          {url ? (
            <a className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-lime px-4 text-sm font-extrabold text-night"
              href={url} rel="noreferrer" target="_blank"><SystemIcon name="link" className="size-4" />Abrir material ↗</a>
          ) : <p className="rounded-md bg-panel-secondary p-3 text-center text-xs text-ink-muted">Enlace disponible al entregar</p>}
          <div className="divide-y divide-line/30 border-y border-line/30">
            <details>
              <summary className="cursor-pointer py-3 text-sm font-semibold">Opinión del operario</summary>
              <p className="pb-4 whitespace-pre-line break-words text-sm leading-6 text-ink-muted">{item.operatorOpinion || "Todavía no dejó una opinión."}</p>
            </details>
            <details>
              <summary className="cursor-pointer py-3 text-sm font-semibold">Referencia de la actividad</summary>
              <p className="break-all pb-2 font-mono text-xs text-ink-muted">ID: {item.id}</p>
              <p className="pb-4 text-xs text-ink-muted">Origen: {item.origin === "burson" ? "Burson" : "Operario"}</p>
            </details>
          </div>
        </div>
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
    return <DetailPanel key={`${year}-${props.selectionKey}`} {...props} item={item} choices={all.filter(candidate=>props.choices.some(choice=>choice.id===candidate.id))} onChoose={props.onChoose}/>;
  }}/>;
}
