"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { IntentLink as Link } from "@/components/intent-link";
import { SystemIcon, type IconName } from "@/components/system-icon";
import { StatusPill } from "@/components/status-pill";
import { ClassificationBadge } from "@/components/classification-badge";
import { replacementsForService, type AunorActivityRow, type AunorReplacement, type AunorWorkspace } from "@/lib/aunor";
import { contractReferences, referenceLabel } from "@/lib/contract-reference";
import { contractProgress, periodLabel, type ContractPeriod } from "@/lib/contract-progress";
import s from "./aunor-contract.module.css";

const iconFor: Record<string, IconName> = {
  cobertura: "camera", redes: "video", micronews: "activities", fiesta: "video",
  campanas: "accounts", "seguridad-vial": "video", voluntariado: "accounts",
  webinars: "video", radio: "messages", "resumen-anual": "activities",
  "social-ambiental": "accounts", ositran: "video",
};
const monthName = (month: string) => new Intl.DateTimeFormat("es-PE", {month:"long", year:"numeric", timeZone:"UTC"}).format(new Date(`${month}-01T12:00:00Z`));
const activityHref = (id: string) => `/aunor/actividades/${encodeURIComponent(id)}`;
type Progress = ReturnType<typeof contractProgress>;
function Count({ progress }: { progress: Progress }) {
  return <span className={s.count}>{progress.count}<span>/{progress.target ?? "—"}</span></span>;
}
function Meter({ progress }: { progress: Progress }) {
  if (progress.target === null || progress.target <= 0) return <div className={s.unknownLine} aria-hidden="true"/>;
  return <progress className={`${s.meter} ${progress.count >= progress.target ? s.completeMeter : ""}`}
    value={Math.min(progress.count, progress.target)} max={progress.target}
    aria-label="Cumplimiento del periodo" aria-valuetext={`${progress.count} de ${progress.target} trabajos entregados`}/>;
}
function progressLabel(p: Progress) {
  if (p.target === null) return "Meta por confirmar";
  if (p.excess) return `+${p.excess} sobre la meta`;
  if (p.target === 0) return "Sin cuota exigida";
  return p.count >= p.target ? "Meta alcanzada" : `${p.target - p.count} para la meta`;
}
function WorkList({ activities }: { activities: AunorActivityRow[] }) {
  return <ul className={s.workList}>{activities.map(a => <li key={a.id}>
    <Link href={activityHref(a.id)} className={s.workLink}>
      <span className={s.workCopy}><strong>{a.title}</strong><span className={s.workMeta}>
        <StatusPill status={a.status}/><ClassificationBadge value={a.classification}/>
      </span>{a.not_performed_reason && <small>No se realizó: {a.not_performed_reason}</small>}</span>
      <span className={s.workAction}>Ver actividad <SystemIcon name="arrow-right" className="size-4"/></span>
    </Link>
  </li>)}</ul>;
}

/** Read-only presentation. Counts still come exclusively from contractProgress. */
export function AunorContract({ w, initialMonth, renderReplacement }: {
  w: AunorWorkspace; initialMonth: string;
  renderReplacement: (replacement: AunorReplacement) => ReactNode;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);
  const [showUnlinked, setShowUnlinked] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const periods = useMemo(() => w.contractPeriods ?? [], [w.contractPeriods]);
  const entries = useMemo(() => w.services.map(service => {
    const period = periods.find(p => p.service_id === service.id && p.starts_on.slice(0,7) <= month && p.ends_on.slice(0,7) >= month);
    return { service, period, cadence: period?.cadence ?? contractReferences[service.id]?.cadence,
      progress: contractProgress(w, service.id, period), replacements: replacementsForService(w, service.id) };
  }), [w, periods, month]);
  const selectedEntry = entries.find(e => e.service.id === selected);
  const open = selected !== null;
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    element?.querySelector<HTMLButtonElement>("button")?.focus({preventScroll:true});
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; trigger.current?.focus({preventScroll:true}); };
  }, [open]);
  useEffect(() => {
    const track = rail.current, active = track?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (track && active && track.scrollWidth > track.clientWidth) {
      track.scrollLeft += active.getBoundingClientRect().left - track.getBoundingClientRect().left - (track.clientWidth-active.clientWidth)/2;
    }
  }, [month]);
  const [year, number] = month.split("-").map(Number);
  // Rolling window from the operational start, with access to legacy periods too.
  const serial = year * 12 + number - 1;
  const startSerial = Math.min(serial, Math.max(2026 * 12 + 3, serial - 5));
  const months = Array.from({length:6}, (_,i) => new Date(Date.UTC(Math.floor((startSerial+i)/12),(startSerial+i)%12,1)).toISOString().slice(0,7));
  const knownServices = new Set(w.services.map(service => service.id));
  const unlinked = w.activities.filter(a => !a.service_id || !knownServices.has(a.service_id));
  function close() { setSelected(null); }
  function changeMonth(value: string) { if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) setMonth(value); }
  function cards(cadence: "monthly" | "annual" | undefined) {
    const group = entries.filter(entry => entry.cadence === cadence);
    if (!group.length) return null;
    const title = cadence === "annual" ? "Compromisos del ciclo" : cadence === "monthly" ? "Servicios del mes" : "Periodicidad por confirmar";
    return <section className={s.section} aria-label={title}>
      <div className={s.sectionHeading}><div><p className="data-label text-cyan-ink">{cadence === "annual" ? "Seguimiento anual" : cadence === "monthly" ? "Control mensual" : "Servicios registrados"}</p><h2>{title}</h2></div>
        <p>{cadence === "annual" ? "Ciclos registrados que incluyen el mes consultado" : `${monthName(month)} · Entregadas / meta`}</p></div>
      <div className={cadence === "annual" ? s.annualGrid : s.grid}>
        {group.map(({service, period, progress:p, replacements}) => {
          const reached = p.target !== null && p.target > 0 && p.count >= p.target;
          return <button type="button" key={service.id} className={`${s.card} ${cadence === "annual" ? s.annualCard : ""} ${reached ? s.reached : ""}`}
            aria-haspopup="dialog" aria-label={`${service.label}: ${p.ratio}. Ver entregas`}
            onClick={event => {trigger.current=event.currentTarget;setSelected(service.id);}}>
            <span className={s.cardTop}><span className={s.symbol}><SystemIcon name={iconFor[service.id] ?? "activities"} className="size-5"/></span>
              <span className={reached ? s.achieved : s.muted}>{reached && <SystemIcon name="check" className="size-3"/>}{!period ? "Periodo por confirmar" : p.target===null ? "Meta por confirmar" : reached ? "Meta alcanzada" : p.count===0 ? "Sin entregas" : "Avance del periodo"}</span></span>
            <span className={s.cardTitle}>{service.label}</span>
            <span className={s.quantity}><Count progress={p}/><span>trabajos entregados</span></span>
            <Meter progress={p}/>
            <span className={s.cardNotes}>
              {cadence === "annual" && <span className={s.period}>{period ? periodLabel(period) : "Periodo por confirmar"}</span>}
              {replacements.length > 0 && <span className={s.observed}>Observado: tiene reemplazo</span>}
            </span>
            <span className={s.cardFooter}><span>{progressLabel(p)}</span><span>Ver entregas <SystemIcon name="arrow-right" className="size-4"/></span></span>
          </button>;
        })}
      </div>
      {cadence === "annual" && <p className={s.footnote}>El ciclo de seguimiento no indica el vencimiento del contrato.</p>}
    </section>;
  }
  function periodSummary(p: Progress, period?: ContractPeriod) {
    return <div className={s.summary}>
      <p className="data-label text-cyan-ink">{period ? `${period.cadence === "annual" ? "Control anual" : "Control mensual"} · ${periodLabel(period)}` : "Periodo por confirmar"}</p>
      <div className={s.summaryCount}><Count progress={p}/><span>trabajos entregados</span></div>
      <Meter progress={p}/><p className={s.summaryLabel}>{progressLabel(p)}{p.excess>0 && " · sin traslado a otro periodo"}</p>
      {!period && <p>La meta de referencia no se aplica a fechas no confirmadas.</p>}
      {period && p.target===null && <p>No se calcula un porcentaje sin una cuota acordada.</p>}
    </div>;
  }
  return <div className={s.contract}>
    <div className={s.monthToolbar}><p><SystemIcon name="calendar" className="size-4"/>Consulta el avance de cada compromiso</p>
      <label>Consultar mes<input type="month" value={month} onChange={e=>changeMonth(e.target.value)}/></label></div>
    <div className={s.monthRail} ref={rail} role="group" aria-label="Meses del contrato"><span>{months[0].slice(0,4)===months[5].slice(0,4) ? year : `${months[0].slice(0,4)}–${months[5].slice(2,4)}`}</span>
      {months.map(value=><button key={value} type="button" aria-label={monthName(value)} aria-pressed={month===value} onClick={()=>setMonth(value)}>
        {monthName(value).split(" de ")[0]}<small>{month===value ? "Mes consultado" : "Ver periodo"}</small>
      </button>)}
    </div>
    {cards("monthly")}{cards("annual")}{cards(undefined)}
    {!entries.length && <p className={s.empty}>No hay servicios de contrato disponibles para esta cuenta.</p>}
    <section className={s.unlinked} aria-label="Trabajos por relacionar">
      <div><SystemIcon name="link" className="size-5"/><span><strong>{unlinked.length} {unlinked.length===1 ? "trabajo" : "trabajos"} por relacionar</strong><small>Visibles para consulta; todavía no suman al contrato.</small></span></div>
      {unlinked.length>0 && <button type="button" aria-expanded={showUnlinked} onClick={()=>setShowUnlinked(v=>!v)}>{showUnlinked ? "Ocultar trabajos" : "Ver trabajos"}<SystemIcon name="arrow-right" className="size-4"/></button>}
      {showUnlinked && <div className={s.unlinkedList}><WorkList activities={unlinked}/></div>}
    </section>
    <details className={s.rules}><summary>Cómo se calcula el avance</summary><p>Solo se cuentan actividades entregadas, vinculadas al servicio y con periodo confirmado por Admin. Los excedentes permanecen en su periodo. El marcaje Especial no duplica unidades ni aprueba pagos. Los originales sustituidos y los trabajos no realizados se conservan en el detalle, sin sumarse al cumplimiento.</p><p>Nombres abreviados para lectura. Esta lista no modifica el texto firmado.</p></details>
    {open && <dialog ref={dialog} className={s.dialog} tabIndex={-1} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();close();}}
      onKeyDown={event=>{
        if(event.key!=="Tab")return;
        const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],select:not(:disabled),summary,[tabindex="0"]'))
          .filter(element=>element.getClientRects().length>0);
        const first=controls[0],last=controls.at(-1);
        if(!first){event.preventDefault();event.currentTarget.focus();}
        else if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      }}>
      <header className={s.dialogHeader}><div><p className="data-label text-cyan-ink">Detalle del servicio · Solo consulta</p><h2 id={titleId}>{selectedEntry?.service.label ?? "Servicio no disponible"}</h2></div><button type="button" onClick={close} aria-label="Cerrar detalle">×</button></header>
      {selectedEntry ? <div className={s.dialogBody}>
        <p className={s.footnote}>Referencia contractual: {selectedEntry.service.reference}</p>
        {contractReferences[selected!] && <p className={s.footnote}>Referencia confirmada: {referenceLabel(selected!)}. Inicio operativo: abril de 2026.</p>}
        {periods.some(p=>p.service_id===selected) && <label className={s.periodSelect}>Periodos registrados<select value={selectedEntry.period?.id ?? ""} onChange={e=>{const p=periods.find(p=>p.id===e.target.value);if(p)setMonth(p.starts_on.slice(0,7));}}>
          <option value="" disabled>Sin periodo para el mes consultado</option>
          {periods.filter(p=>p.service_id===selected).sort((a,b)=>a.starts_on.localeCompare(b.starts_on)).map(p=><option key={p.id} value={p.id}>{periodLabel(p)}</option>)}
        </select></label>}
        {periodSummary(selectedEntry.progress,selectedEntry.period)}
        <section className={s.deliveries}><h3>Entregas del periodo ({selectedEntry.progress.count})</h3>
          {selectedEntry.progress.delivered.length ? <WorkList activities={selectedEntry.progress.delivered}/> : <p className={s.empty}>No hay entregas computables en el periodo consultado.</p>}
        </section>
        {selectedEntry.progress.pending.length>0 && <details className={s.detailSection}><summary>Programadas o en proceso ({selectedEntry.progress.pending.length})</summary><p>No suman hasta alcanzar el estado Entregada.</p><WorkList activities={selectedEntry.progress.pending}/></details>}
        {selectedEntry.progress.unassigned.length>0 && <details className={s.detailSection}><summary>Por confirmar periodo ({selectedEntry.progress.unassigned.length})</summary><p>Se conservan visibles, pero no incrementan el cumplimiento mensual o anual.</p><WorkList activities={selectedEntry.progress.unassigned}/></details>}
        {selectedEntry.progress.excluded.length>0 && <details className={s.detailSection}><summary>No computables ({selectedEntry.progress.excluded.length})</summary><p>Trabajos no realizados u originales sustituidos. Se conservan sin sumar dos veces.</p><WorkList activities={selectedEntry.progress.excluded}/></details>}
        {selectedEntry.replacements.length>0 && <details className={s.detailSection}><summary>Reemplazos documentados ({selectedEntry.replacements.length})</summary>{selectedEntry.replacements.map(r=><div className={s.replacement} key={r.id}>{renderReplacement(r)}<Link className={s.detailLink} href={`/aunor/reemplazos/${encodeURIComponent(r.id)}`}>Ver original, sustituto y evidencia →</Link></div>)}</details>}
      </div> : <p className={s.empty}>El servicio ya no está disponible. Cierra el detalle para consultar la lista actualizada.</p>}
    </dialog>}
  </div>;
}
