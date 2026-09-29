"use client";
import { IntentLink as Link } from "@/components/intent-link";
import { useState } from "react";
import { Button } from "@/components/button";
import { StatusPill } from "@/components/status-pill";
import { SystemIcon } from "@/components/system-icon";
import {
  AnnualCalendarView,
} from "@/components/annual-calendar-view";
import { AunorDashboard } from "@/components/aunor-dashboard";
import { DetailPanel, type DetailActivity } from "@/components/calendar-detail-panel";
import { RecordingModeTags } from "@/components/recording-mode-tags";
import { ClassificationBadge } from "@/components/classification-badge";
import { contractReferences, referenceLabel } from "@/lib/contract-reference";
import { contractProgress, periodLabel } from "@/lib/contract-progress";
import { calendarDateInLima } from "@/lib/historical";
import type { HistoricalCategory } from "@/lib/historical";
import {
  aunorCode,
  replacementsForService,
  type AunorActivityRow,
  type AunorWorkspace,
  type AunorReplacement,
} from "@/lib/aunor";
import type { Role } from "@/lib/roles";
import { safeMaterialUrl } from "@/lib/external-link";
import { displayOrganizationAuthor } from "@/lib/brand";
import { useAunorWorkspace } from "@/lib/use-aunor-workspace";
import s from "./aunor-space.module.css";

export type AunorScene =
  | "panel"
  | "detail"
  | "acordado"
  | "calendar"
  | "replacement";
const date = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value.length === 10 ? value + "T12:00:00Z" : value));
const moment = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
export const activityHref = (id: string) =>
  "/aunor/actividades/" + encodeURIComponent(id);
const replacementHref = (id: string) =>
  "/aunor/reemplazos/" + encodeURIComponent(id);
const serviceName = (w: AunorWorkspace, id: string | null) =>
  w.services.find((s) => s.id === id)?.label;
export function AunorJourneys({ w, id }: { w: AunorWorkspace; id: string }) {
  const a = w.activities.find((a) => a.id === id);
  const journeys = w.journeys.filter((j) => j.activity_id === id);
  return (
    <div>
      {journeys.length ? (
        journeys.map((j) => (
          <div className={s.journey} key={j.position}>
            <SystemIcon name="calendar" className="size-4" />
            <strong>
              {date(j.start_date)}
              {j.start_date !== j.end_date ? " – " + date(j.end_date) : ""}
            </strong>
            <span>{j.place || a?.place || "Lugar por indicar"}</span>
          </div>
        ))
      ) : (
        <p className={s.muted}>Sin jornadas registradas.</p>
      )}
    </div>
  );
}
function ServiceTag({ w, a }: { w: AunorWorkspace; a: AunorActivityRow }) {
  return a.service_id ? (
    <span>{serviceName(w, a.service_id)} · 2.2</span>
  ) : (
    <span className={s.unlinked}>Por relacionar</span>
  );
}
export function AunorActivityCard({
  a,
  w,
}: {
  a: AunorActivityRow;
  w: AunorWorkspace;
}) {
  const delivery = w.deliveries.find(
    (d) => d.activity_id === a.id && d.is_current,
  );
  return (
    <article className={s.card}>
      <div className={s.top + " " + (a.type === "Edición" ? s.edit : "")}>
        <div className={s.row}>
          <p className="data-label text-cyan-ink">
            {a.type} · {aunorCode(a.id, a.type)}
          </p>
          <StatusPill status={a.status} />
        </div>
        <h2 className="section-title">{a.title}</h2>
      </div>
      <div className={s.body}>
        <AunorJourneys w={w} id={a.id} />
        <p className={s.state}>
          {a.not_performed_reason ? (
            <>
              <b>No se realizó:</b> {a.not_performed_reason}
            </>
          ) : delivery ? (
            <>
              <b>Entrega:</b>{" "}
              {delivery.confirmed_at
                ? "Confirmada por Aunor."
                : "Material disponible."}
            </>
          ) : a.service_id ? (
            <>
              <b>
                {a.status === "Programada"
                  ? "Planificación publicada."
                  : "Entrega:"}
              </b>{" "}
              {a.status === "Programada"
                ? "Jornadas aún por realizar."
                : "El material todavía no se ha publicado."}
            </>
          ) : (
            <>
              Es un trabajo de Aunor. <b>Falta asociarlo a un servicio.</b>
            </>
          )}
        </p>
      </div>
      <div className={s.footer}>
        <ServiceTag a={a} w={w} />
      </div>
      <div className={s.footer + " " + s.white}>
        <Link className={s.btn} href={activityHref(a.id)}>
          Ver actividad →
        </Link>
        <span>Visible para Aunor</span>
      </div>
    </article>
  );
}
function ActivityDetail({
  w,
  id,
}: {
  w: AunorWorkspace;
  id: string;
}) {
  const a = w.activities.find((a) => a.id === id);
  if (!a)
    return (
      <div className={s.empty}>
        La actividad no está disponible para esta cuenta.
      </div>
    );
  const current = w.deliveries.find(
    (d) => d.activity_id === id && d.is_current,
  );
  const replacements = w.replacements.filter(
    (r) => r.original_activity_id === id || r.substitute_activity_id === id,
  );
  return (
    <div className={s.stack}>
      <section className={s.card}>
        <div className={s.hero + " technical-surface"}>
          <p className="data-label">
            {a.type} · {aunorCode(a.id, a.type)}
          </p>
          <h2>{a.title}</h2>
          <p>{a.summary}</p>
          <RecordingModeTags modes={a.recording_modes} />
          <ClassificationBadge value={a.classification}/>
          {a.delivery_due_on && <p className={s.muted}>Entrega prevista: {a.delivery_due_on}</p>}
          {a.historical_regularized_at && <p className={s.muted}>Entrega histórica regularizada. Fecha real de entrega desconocida.</p>}
          <div className="status-in-hero mt-4">
            <StatusPill status={a.status} />
          </div>
        </div>
        <dl className={s.meta}>
          <div>
            <dt>Jornadas y lugares</dt>
            <dd>
              <AunorJourneys w={w} id={id} />
            </dd>
          </div>
          <div>
            <dt>Referencia</dt>
            <dd>
              <ServiceTag a={a} w={w} />
            </dd>
          </div>
        </dl>
        <div className={s.pad}>
          <h2 className="section-title">Entrega</h2>
          {current ? (
            <div className={s.box}>
              <strong>{current.label}</strong>
              <p>
                Entrega {current.id.slice(-8)} · versión {current.version}
              </p>
              <p className={s.footnote}>
                Publicada por DA VINCI · {moment(current.published_at)}
              </p>
              {safeMaterialUrl(current.material_link) && (
                <a
                  className={s.btn + " " + s.primary + " " + s.sectionGap}
                  href={safeMaterialUrl(current.material_link)!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir material ↗
                </a>
              )}
            </div>
          ) : a.status === "Entregada" && safeMaterialUrl(a.material_link ?? "") ? (
            <div className={s.box}>
              <strong>Material entregado</strong>
              {a.delivered_at && <p className={s.footnote}>{moment(a.delivered_at)}</p>}
              <a className={s.btn + " " + s.primary + " " + s.sectionGap} href={safeMaterialUrl(a.material_link!)!} target="_blank" rel="noopener noreferrer">Abrir material ↗</a>
            </div>
          ) : <p className={s.muted}>No hay un enlace de material disponible.</p>}
          {w.deliveries.some((d) => d.activity_id === id && !d.is_current) && (
            <details className={s.sectionGap}>
              <summary>Entregas anteriores conservadas</summary>
              {w.deliveries
                .filter((d) => d.activity_id === id && !d.is_current)
                .map((d) => (
                  <div key={d.id} className={s.box + " " + s.sectionGap}>
                    <strong>
                      Entrega {d.id.slice(-8)} · versión {d.version}
                    </strong>
                    <p>
                      {d.confirmed_at
                        ? "Confirmada por Aunor el " + moment(d.confirmed_at)
                        : "Sin confirmación"}
                      .
                    </p>
                    <p className={s.muted}>
                      No corresponde al material vigente.
                    </p>
                  </div>
                ))}
            </details>
          )}
          {a.not_performed_reason && (
            <div className={s.notice + " " + s.sectionGap}>
              <strong>No se realizó</strong>
              <p>{a.not_performed_reason}</p>
            </div>
          )}
        </div>
        {replacements.length > 0 && (
          <div className={s.pad}>
            <h2 className="section-title">Originales y sustitutos</h2>
            {replacements.map((r) => (
              <Link
                className={s.btn + " " + s.sectionGap}
                key={r.id}
                href={replacementHref(r.id)}
              >
                Ver relación {r.id.slice(-8)} →
              </Link>
            ))}
          </div>
        )}
      </section>
      <AgreementList w={w} id={id} />
    </div>
  );
}
export function AgreementList({ w, id }: { w: AunorWorkspace; id: string }) {
  const agreements = w.agreements.filter((g) => g.activity_id === id);
  if (!agreements.length) return null;
  return (
    <section className={s.card + " " + s.chat + " " + s.pad}>
      <p className="data-label text-cyan-ink">Registro de contactos</p>
      <h2 className="section-title">Acuerdos registrados por DA VINCI</h2>
      {agreements.map((g) => (
        <div className={s.box + " " + s.sectionGap} key={g.id}>
          <strong>
            {g.channel} · {moment(g.contacted_at)}
          </strong>
          <p>{g.body}</p>
          {!g.is_current && (
            <p className={s.notice}>
              Registro anterior corregido; se conserva como referencia.
            </p>
          )}
          <dl className={s.facts}>
            <div>
              <dt>Solicitante declarado</dt>
              <dd>{g.requester_declared}</dd>
            </div>
            <div>
              <dt>Registrado por</dt>
              <dd>
                {displayOrganizationAuthor(g.recorded_by)} · {moment(g.recorded_at)}
              </dd>
            </div>
          </dl>
          {g.corrects_id && (
            <p className={s.muted}>
              Corrige el registro {g.corrects_id.slice(-8)}; el anterior se
              conserva.
            </p>
          )}
          {safeMaterialUrl(g.evidence_link) && (
            <a
              className={s.link}
              href={safeMaterialUrl(g.evidence_link)!}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir evidencia ↗
            </a>
          )}
          <p className={s.footnote}>
            Registro administrativo. El solicitante es declarado, no una
            identidad comprobada ni una confirmación de Aunor.
          </p>
        </div>
      ))}
    </section>
  );
}
export function ReplacementSummary({
  r,
  w,
  admin = false,
}: {
  r: AunorReplacement;
  w: AunorWorkspace;
  admin?: boolean;
}) {
  const href = (id: string) =>
    admin ? "/actividades/" + encodeURIComponent(id) : activityHref(id);
  const original = w.activities.find((a) => a.id === r.original_activity_id);
  const substitute = w.activities.find(
    (a) => a.id === r.substitute_activity_id,
  );
  return (
    <>
      <div className={s.replacement}>
        <div className={s.box}>
          <p className="data-label">
            Original · {aunorCode(r.original_activity_id, original?.type)}
          </p>
          <strong>{r.original_title}</strong>
          <p className={s.muted}>
            {original?.not_performed_reason
              ? "No se realizó: " + original.not_performed_reason
              : "Original conservado"}
          </p>
          <Link className={s.link} href={href(r.original_activity_id)}>
            Ver original →
          </Link>
        </div>
        <span className={s.arrow}>→</span>
        <div className={s.box}>
          <p className="data-label text-cyan-ink">
            Sustituto · {aunorCode(r.substitute_activity_id, substitute?.type)}
          </p>
          <strong>{r.substitute_title}</strong>
          <AunorJourneys w={w} id={r.substitute_activity_id} />
          <Link className={s.link} href={href(r.substitute_activity_id)}>
            Ver sustituto →
          </Link>
        </div>
      </div>
      <div className={s.stamp + " " + s.sectionGap}>
        <strong>
          {!r.is_current
            ? "Registro anterior conservado"
            : r.confirmed_at
              ? "Reemplazo confirmado por Aunor"
              : "Reemplazo documentado"}
        </strong>
        {r.confirmed_at && <p>{moment(r.confirmed_at)} · cuenta compartida</p>}
        <p className={s.footnote}>
          Relación {r.id.slice(-8)}. No implica equivalencia económica.
        </p>
      </div>
    </>
  );
}
function ReplacementDetail({
  w,
  id,
}: {
  w: AunorWorkspace;
  id: string;
}) {
  const r = w.replacements.find((r) => r.id === id);
  if (!r)
    return (
      <div className={s.empty}>
        El reemplazo no está disponible para esta cuenta.
      </div>
    );
  const g = w.agreements.find((g) => g.id === r.agreement_id);
  return (
    <div className={g && !g.is_current ? s.detail : s.stack}>
      <section className={s.card + " " + s.pad}>
        <p className="data-label text-cyan-ink">Relación {r.id.slice(-8)}</p>
        <h2 className="section-title">Original y sustituto, juntos</h2>
        <ReplacementSummary r={r} w={w} />
        <dl className={s.facts}>
          <div>
            <dt>Motivo</dt>
            <dd>{r.reason}</dd>
          </div>
          <div>
            <dt>Evidencia</dt>
            <dd>{r.evidence_note}</dd>
          </div>
          <div>
            <dt>Solicitante declarado</dt>
            <dd>{g?.requester_declared ?? "Ver registro relacionado"}</dd>
          </div>
          <div>
            <dt>Registrado por</dt>
            <dd>
              {displayOrganizationAuthor(r.recorded_by)} · {moment(r.recorded_at)}
            </dd>
          </div>
        </dl>
        {safeMaterialUrl(r.evidence_link) && (
          <a
            className={s.btn}
            href={safeMaterialUrl(r.evidence_link)!}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir evidencia ↗
          </a>
        )}
        {g && (
          <div className={s.box}>
            <strong>
              {g.channel} · {moment(g.contacted_at)}
            </strong>
            <p>{g.body}</p>
          </div>
        )}
      </section>
      {g && !g.is_current && <aside className={s.card + " " + s.pad}>
        <h2 className="section-title">Acuerdo corregido</h2>
        <p className={s.muted}>El reemplazo conserva su evidencia original.</p>
        <Link className={s.link} href={activityHref(g.activity_id)}>Ver acuerdos y correcciones →</Link>
      </aside>}
    </div>
  );
}
function Agreed({ w }: { w: AunorWorkspace }) {
  const [selected, setSelected] = useState(w.services[0]?.id ?? "");
  const [month,setMonth]=useState(()=>calendarDateInLima().slice(0,7));
  const periods=w.contractPeriods ?? [];
  const periodFor=(serviceId:string)=>periods.find(p=>p.service_id===serviceId && p.starts_on.slice(0,7)<=month && p.ends_on.slice(0,7)>=month);
  const period=periodFor(selected);
  const progress=contractProgress(w,selected,period);
  const related = [...progress.delivered,...progress.pending];
  const replacements = replacementsForService(w, selected);
  return (
    <>
      <div className={s.notice}>
        <strong>Control contractual por periodo</strong>
        <p className={s.muted}>
          Solo se cuentan actividades entregadas, vinculadas al servicio y con periodo confirmado por Admin.
          Los excedentes permanecen en su periodo. El marcaje Especial no duplica unidades ni aprueba pagos.
        </p>
        <label className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold">Consultar mes
          <input className="min-h-11 rounded-md border border-line bg-panel px-3" type="month" min="2026-01" value={month} onChange={e=>{if(e.target.value)setMonth(e.target.value);}}/>
        </label>
      </div>
      <div className={s.grid}>
        <section className={s.card + " " + s.pad + " hidden md:block"}>
          <p className="data-label text-cyan-ink">
            Lista simplificada de servicios
          </p>
          <h2 className="section-title">Qué está previsto</h2>
          {w.services.map((service) => (
            <button
              className={s.service}
              key={service.id}
              type="button"
              aria-pressed={selected === service.id}
              onClick={() => setSelected(service.id)}
            >
              <strong>{service.label}</strong>
              <small>Referencia: {referenceLabel(service.id)}</small>
              <span className="mt-2 flex items-baseline justify-between gap-3"><span className="display-title text-2xl tabular-nums">{contractProgress(w,service.id,periodFor(service.id)).ratio}</span><span className="text-xs text-ink-muted">{periodFor(service.id)?.target ? (periodFor(service.id)?.cadence==="annual" ? "Periodo anual" : "Periodo mensual") : "Meta por confirmar"}</span></span>
              {replacementsForService(w, service.id).length > 0 && (
                <span className={s.observed}>
                  <span aria-hidden="true" className={s.observedIcon}>
                    !
                  </span>
                  <span>Observado: tiene reemplazo</span>
                </span>
              )}
              <small>
                Referencia contractual: {service.reference} · Ver trabajos
                relacionados →
              </small>
            </button>
          ))}
          <p className={s.footnote}>
            Nombres abreviados para lectura. Esta lista no modifica el texto
            firmado.
          </p>
        </section>
        <div className={s.stack}>
          <label className="block text-sm font-bold md:hidden">Servicio del contrato
            <select className="mt-2 min-h-12 w-full min-w-0 rounded-md border border-line bg-panel px-3 text-xs" value={selected} onChange={e=>setSelected(e.target.value)}>
              {w.services.map(service=><option key={service.id} value={service.id}>{service.label} · {contractProgress(w,service.id,periodFor(service.id)).ratio}</option>)}
            </select>
          </label>
          <section className={s.card + " " + s.pad}>
            <p className="data-label text-cyan-ink">
              Servicio seleccionado · 2.2
            </p>
            <h2 className="section-title">{serviceName(w, selected)}</h2>
            {contractReferences[selected] && <p className={s.footnote}>
              Referencia confirmada: {referenceLabel(selected)}. Inicio operativo: abril de 2026.
              {contractReferences[selected].cadence==="annual" && " Ciclo operativo: abril de 2026 a marzo de 2027; no indica el vencimiento del contrato."}
            </p>}
            {periods.some(p=>p.service_id===selected) && <div aria-label="Periodos registrados" className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
              {periods.filter(p=>p.service_id===selected).sort((a,b)=>a.starts_on.localeCompare(b.starts_on)).map(p=><button key={p.id} type="button"
                className={`min-h-16 rounded-md border p-3 text-left text-xs ${p.id===period?.id ? "border-cyan bg-cyan/10" : "border-line bg-panel"}`}
                aria-pressed={p.id===period?.id} onClick={()=>setMonth(p.starts_on.slice(0,7))}>
                <span className="block text-ink-muted">{periodLabel(p)}</span><strong className="display-title mt-1 block text-xl tabular-nums">{contractProgress(w,selected,p).ratio}</strong>
              </button>)}
            </div>}
            <div className="my-4 rounded-[10px] border border-cyan/30 bg-panel-secondary p-4">
              <p className="data-label text-cyan-ink">{period ? `${period.cadence==="annual" ? "Control anual" : "Control mensual"} · ${periodLabel(period)}` : "Periodo por confirmar"}</p>
              <div className="mt-2 flex items-baseline gap-3"><strong className="display-title text-4xl tabular-nums">{progress.ratio}</strong><span className="text-sm text-ink-muted">trabajos entregados</span></div>
              {progress.target===null ? <p className="mt-2 text-sm text-ink-muted">{!period && contractReferences[selected]?.target!==null && contractReferences[selected] ? "Periodo por confirmar. La meta de referencia no se aplica a fechas no confirmadas." : "Meta por confirmar. No se calcula un porcentaje sin una cuota acordada."}</p> : <>
                <progress className="mt-3 h-2 w-full accent-[#11b4c6]" value={Math.min(progress.count,progress.target)} max={progress.target} aria-label="Cumplimiento del periodo"/>
                <p className="mt-2 text-sm font-bold">{progress.excess ? `${progress.excess} adicionales · sin traslado a otro periodo` : `${Math.max(0,progress.target-progress.count)} pendientes para alcanzar la meta`}</p>
              </>}
              <p className="mt-2 text-xs text-ink-muted">{progress.pending.length} trabajos programados o en proceso · {progress.unassigned.length} por asignar a un periodo</p>
            </div>
            {replacements.length > 0 && (
              <p className={s.observed}>
                <span aria-hidden="true" className={s.observedIcon}>
                  !
                </span>
                <span>Observado: tiene reemplazo</span>
              </p>
            )}
            {!related.length && (
              <p className={s.muted}>
                No hay trabajos asignados al periodo consultado.
              </p>
            )}
            {related.map((a) => (
              <div className={s.box + " " + s.sectionGap} key={a.id}>
                <strong>{a.title}</strong>
                <p>
                  {a.not_performed_reason
                    ? "No se realizó: " + a.not_performed_reason
                    : a.status === "Entregada"
                      ? "Entregada. Material disponible en la actividad."
                      : a.status}
                </p>
                <Link className={s.link} href={activityHref(a.id)}>
                  Ver actividad →
                </Link>
              </div>
            ))}
            {progress.unassigned.length>0 && <details className="my-4 rounded-md border border-line p-3"><summary className="cursor-pointer text-sm font-bold">Por confirmar periodo ({progress.unassigned.length})</summary>
              <p className="mt-2 text-xs text-ink-muted">Se conservan visibles, pero no incrementan el cumplimiento mensual o anual.</p>
              {progress.unassigned.map(a=><div className="mt-3" key={a.id}><Link className={s.link} href={activityHref(a.id)}>{a.title} →</Link></div>)}
            </details>}
            {progress.excluded.length>0 && <details className="my-4 rounded-md border border-line p-3"><summary className="cursor-pointer text-sm font-bold">No computables ({progress.excluded.length})</summary>
              <p className="mt-2 text-xs text-ink-muted">Trabajos no realizados u originales sustituidos. Se conservan sin sumar dos veces.</p>
              {progress.excluded.map(a=><div className="mt-3" key={a.id}><Link className={s.link} href={activityHref(a.id)}>{a.title} →</Link><p className="text-xs text-ink-muted">{a.not_performed_reason || "Original sustituido"}</p></div>)}
            </details>}
            {replacements.map((r) => (
              <div className={s.sectionGap} key={r.id}>
                <ReplacementSummary r={r} w={w} />
                <Link
                  className={s.btn + " " + s.sectionGap}
                  href={replacementHref(r.id)}
                >
                  Ver original, sustituto y evidencia →
                </Link>
              </div>
            ))}
          </section>
          <section className={s.card + " " + s.pad}>
            <p className="data-label text-cyan-ink">Trabajo visible de Aunor</p>
            <h2 className="section-title">Por relacionar</h2>
            {w.activities
              .filter((a) => !a.service_id)
              .map((a) => (
                <div className={s.box + " " + s.sectionGap} key={a.id}>
                  <strong>{a.title}</strong>
                  <AunorJourneys w={w} id={a.id} />
                  <p className={s.muted}>
                    Todavía no tiene un servicio contractual asociado.
                  </p>
                  <Link className={s.link} href={activityHref(a.id)}>
                    Ver actividad →
                  </Link>
                </div>
              ))}
            {!w.activities.some((a) => !a.service_id) && (
              <p className={s.muted}>
                No hay trabajos pendientes de relacionar.
              </p>
            )}
            <p className={s.footnote}>
              El trabajo y su entrega siguen visibles aunque falte esta
              relación.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
export function AunorSpace({
  initial, scene, id = "", demo = false, year = 2026, today = "2026-09-06", initialNow, category,
}: {
  initial: AunorWorkspace; role: Role; scene: AunorScene; id?: string;
  demo?: boolean; year?: number; today?: string; initialNow?: number; category?: HistoricalCategory;
}) {
  const {w,error,refresh} = useAunorWorkspace(initial,scene,id);
  const names = {
    panel: ["Actividades", "Seguimiento del trabajo audiovisual de DA VINCI."],
    detail: ["Detalle de actividad", "Consulta de jornadas, estado y material."],
    acordado: ["Contrato", "Los servicios previstos y el trabajo que se relaciona con ellos."],
    calendar: ["Histórico", "Todas las actividades, organizadas por fecha."],
    replacement: ["Reemplazo documentado", "Original, sustituto, motivo y evidencia conservados."],
  };
  const calendarItems: DetailActivity[] = scene === "calendar" ? w.activities.map(a => ({
    id:a.id,type:a.type,title:a.title,status:a.status,place:a.place,description:a.summary,recordingModes:a.recording_modes,
    classification:a.classification,deliveryDueOn:a.delivery_due_on,historicalRegularizedAt:a.historical_regularized_at,
    materialLink:a.status === "Entregada" ? a.material_link ?? "" : "",
    spans:w.journeys.filter(j=>j.activity_id===a.id).map(j=>({start:j.start_date,end:j.end_date,place:j.place})),
  })) : [];
  return <main className={s.page}>
    {demo && <div className={s.demo}><strong>DEMOSTRACIÓN AISLADA · EJEMPLOS FICTICIOS</strong><p>No son datos contractuales reales.</p></div>}
    {scene !== "calendar" && <header className={`${s.head} flex flex-wrap items-center justify-between gap-4`}><div><p className="data-label text-cyan-ink">Espacio Aunor · solo lectura</p><h1 className="section-title">{names[scene][0]}</h1><p className="text-ink-muted">{names[scene][1]}</p></div><Button variant="secondary" onClick={()=>void refresh(true)}>Actualizar</Button></header>}
    {error && <div className={s.error} role="alert">{error} <button type="button" onClick={()=>void refresh(true)}>Reintentar</button></div>}
    {scene === "calendar" && <div className="mb-4 flex justify-end"><Button variant="secondary" onClick={()=>void refresh(true)}>Actualizar</Button></div>}
    {scene === "panel" && <AunorDashboard w={w} today={today} initialNow={initialNow ?? Date.parse(today+"T12:00:00Z")}/>}
    {scene === "detail" && <ActivityDetail key={id} w={w} id={id}/>}
    {scene === "acordado" && <Agreed w={w}/>}
    {scene === "replacement" && <ReplacementDetail key={id} w={w} id={id}/>}
    {scene === "calendar" && <AnnualCalendarView basePath="/aunor/historico" category={category} activities={calendarItems} year={year} today={today}
      renderDetail={props => {
        const item = calendarItems.find(a=>a.id===props.item.id);
        return item ? <DetailPanel key={year+"-"+props.selectionKey} {...props} clientView item={item} choices={calendarItems.filter(a=>props.choices.some(c=>c.id===a.id))}/> : null;
      }}/>}
  </main>;
}
