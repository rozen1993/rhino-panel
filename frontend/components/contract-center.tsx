"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { replacementsForService, type AunorActivityRow, type AunorReplacement, type AunorWorkspace } from "@/lib/aunor";
import { periodLabel } from "@/lib/contract-progress";
import { contractOverview, latestContractDelivery } from "@/lib/contract-overview";
import { Button } from "./button";
import { StatusPill } from "./status-pill";
import { SystemIcon } from "./system-icon";
import s from "./admin-workspace.module.css";

export function ContractCenter({
  w, initialMonth, management, renderReplacement,
}: {
  w: AunorWorkspace;
  initialMonth: string;
  management?: (serviceId: string) => ReactNode;
  renderReplacement?: (replacement: AunorReplacement) => ReactNode;
}) {
  const admin = Boolean(management);
  const [month, setMonth] = useState(initialMonth),
    [cadence, setCadence] = useState<"monthly" | "annual">("monthly");
  const [selected, setSelected] = useState(""),
    [config, setConfig] = useState(false),
    [exceptions, setExceptions] = useState(false);
  const detail = useRef<HTMLElement>(null),
    lastTrigger = useRef<HTMLButtonElement | null>(null);
  const {entries, replaced, needsReview, unlinked} = useMemo(() => contractOverview(w, month), [w, month]);
  const latest = useMemo(() => latestContractDelivery(entries, cadence), [entries, cadence]);
  const chosen = entries.find((e) => e.service.id === selected);
  const returnTo = `${admin ? "/contrato" : "/aunor/contrato"}?mes=${month}`;
  const activityHref = (id: string) => admin ? `/actividades/${id}?volver=${encodeURIComponent(returnTo)}` : `/aunor/actividades/${id}`;
  useEffect(() => {
    if (selected || exceptions) {
      detail.current?.focus();
      detail.current?.scrollIntoView?.({ block: "nearest" });
    }
  }, [selected, exceptions]);
  function close() {
    setSelected("");
    setExceptions(false);
    setConfig(false);
    lastTrigger.current?.focus();
  }
  function open(id: string, button: HTMLButtonElement) {
    lastTrigger.current = button;
    setExceptions(false);
    setSelected(id);
    setConfig(false);
  }
  function changeMonth(value: string) {
    if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(value)) return;
    setMonth(value);
    window.history.replaceState(null, "", `${admin ? "/contrato" : "/aunor/contrato"}?mes=${value}`);
  }
  function workList(items: AunorActivityRow[], empty: string) {
    return items.length ? (
      <ul className={s.list}>
        {items.map((a) => (
          <li key={a.id}>
            <div>
              <Link
                href={activityHref(a.id)}
              >
                {a.title}
              </Link>
              <small>
                {a.type}
                {a.not_performed_reason ? " · No realizada" : ""}
                {replaced.has(a.id) ? " · Sustituida" : ""}
              </small>
            </div>
            <StatusPill status={a.status} />
          </li>
        ))}
      </ul>
    ) : (
      <p className={`${s.muted} my-4`}>{empty}</p>
    );
  }
  return (
    <>
      <div className={s.toolbar}>
        <div className={s.tabs} aria-label="Periodicidad">
          <button
            type="button"
            aria-pressed={cadence === "monthly"}
            onClick={() => {
              setCadence("monthly");
              close();
            }}
          >
            Mensual
          </button>
          <button
            type="button"
            aria-pressed={cadence === "annual"}
            onClick={() => {
              setCadence("annual");
              close();
            }}
          >
            Anual
          </button>
        </div>
        <label className={s.label}>
          Consultar mes
          <input
            className={s.input}
            type="month"
            min="2026-01"
            value={month}
            onChange={(e) => changeMonth(e.target.value)}
          />
        </label>
        {admin ? <Button
          variant="secondary"
          onClick={(e) => {
            open(
              entries.find((e) => e.cadence === cadence)?.service.id ?? "",
              e.currentTarget,
            );
            setConfig(true);
          }}
        >
          Periodos y metas
        </Button> : <span className="rounded-md bg-cyan/10 px-3 py-2 text-xs font-bold text-cyan-ink">Solo lectura</span>}
      </div>
      <div className={`${s.note} flex flex-wrap items-center justify-between gap-3`} aria-label="Novedades del contrato">
        <div><strong>Última entrega registrada</strong>
          {latest ? <p><Link className="font-bold underline underline-offset-4" href={activityHref(latest.id)}>{latest.title}</Link> · {latest.service}</p>
            : <p>No hay entregas con fecha de registro disponible en el periodo consultado.</p>}
          <p className="mt-1 text-ink-muted">{cadence === "annual" ? "Ciclo anual consultado" : "Mes consultado"} · Solo entregas que suman al contrato.</p>
        </div>
        {latest && <time className="text-xs text-ink-muted" dateTime={latest.deliveredAt}>{new Intl.DateTimeFormat("es-PE", {dateStyle:"medium",timeStyle:"short",timeZone:"America/Lima"}).format(new Date(latest.timestamp))} · Lima</time>}
      </div>
      <section
        className={s.grid}
        aria-label={
          cadence === "monthly" ? "Servicios mensuales" : "Servicios anuales"
        }
      >
        {entries
          .filter((e) => e.cadence === cadence || (cadence === "monthly" && !e.cadence))
          .map(({ service, period, progress, cadence: serviceCadence }) => {
            const reached =
              progress.target !== null &&
              progress.target > 0 &&
              progress.count >= progress.target;
            return (
              <article
                key={service.id}
                className={`${s.panel} ${s.service} ${reached ? s.reached : ""}`}
              >
                <div className={s.serviceTop}>
                  <SystemIcon name="activities" className="size-5" />
                  <span>
                    {!serviceCadence ? "Periodicidad por confirmar" : !period ? "Periodo por confirmar" : reached
                      ? "✓ Meta alcanzada"
                      : cadence === "annual"
                        ? "Control anual"
                        : "Control mensual"}
                  </span>
                </div>
                <h2>{service.label}</h2>
                <p className={s.ratio}>
                  {progress.count}
                  <small>/{progress.target ?? "—"}</small>
                </p>
                <p className={s.muted}>trabajos entregados</p>
                {replacementsForService(w, service.id).length > 0 && <p className="mt-2 text-xs font-bold text-cyan-ink">Observado: tiene reemplazo</p>}
                {progress.target !== null && progress.target > 0 && (
                  <progress
                    className={s.progress}
                    max={progress.target}
                    value={Math.min(progress.count, progress.target)}
                    aria-label={`Avance de ${service.label}`}
                    aria-valuetext={`${progress.count} de ${progress.target} trabajos entregados`}
                  />
                )}
                <p className={s.muted}>
                  {progress.target === null
                    ? "Meta por confirmar"
                    : progress.excess
                      ? `+${progress.excess} sobre la meta · sin traslado a otro periodo`
                      : reached
                        ? "Compromiso del periodo cubierto"
                        : `${progress.target - progress.count} para completar la meta`}
                </p>
                <div className={`${s.actions} !mt-4 !pt-3`}>
                  <span className={s.muted}>
                    {period ? periodLabel(period) : "Periodo por confirmar"}
                  </span>
                  <button
                    type="button"
                    className={s.link}
                    aria-label={`${service.label}: ${progress.ratio}. Ver trabajos`}
                    aria-expanded={selected === service.id}
                    onClick={(e) => open(service.id, e.currentTarget)}
                  >
                    Ver trabajos <span aria-hidden>→</span>
                  </button>
                </div>
              </article>
            );
          })}
      </section>
      {!entries.length && <p className={s.notice}>No hay servicios de contrato disponibles para esta cuenta.</p>}
      <section className={s.panel}>
        {admin && <div className={s.row}>
          <div>
            <strong>
              {needsReview.length}{" "}
              {needsReview.length === 1
                ? "trabajo requiere"
                : "trabajos requieren"}{" "}
              revisión de periodo
            </strong>
            <p className={s.muted}>
              Todos los meses · fechas ausentes o jornadas que cruzan periodos.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={(e) => {
              lastTrigger.current = e.currentTarget;
              setSelected("");
              setExceptions(true);
            }}
          >
            Revisar excepciones
          </Button>
        </div>}
        <div className={s.row}>
          <div>
            <strong>
              {unlinked.length} {unlinked.length === 1 ? "trabajo" : "trabajos"}{" "}
              por relacionar
            </strong>
            <p className={s.muted}>
              No suman a ningún servicio hasta que Admin los relacione.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={(e) => {
              lastTrigger.current = e.currentTarget;
              setSelected("");
              setExceptions(true);
            }}
          >
            Ver trabajos sin servicio
          </Button>
        </div>
        {cadence === "monthly" && (
          <div className={s.row}>
            <div>
              <strong>Compromisos anuales</strong>
              <p className={s.muted}>
                Resumen anual, fiesta de fin de año, social / ambiental y
                OSITRAN.
              </p>
            </div>
            <button
              className={s.link}
              onClick={() => {
                setCadence("annual");
                close();
              }}
            >
              Consultar ciclo anual →
            </button>
          </div>
        )}
      </section>
      {(selected || exceptions) && (
        <section
          ref={detail}
          tabIndex={-1}
          className={`${s.panel} ${s.details}`}
          aria-label={
            exceptions ? "Excepciones contractuales" : "Detalle del servicio"
          }
        >
          <header className={s.head}>
            <div>
              <p className="data-label text-cyan-ink">{admin ? "Gestión contractual" : "Detalle del servicio · Solo consulta"}</p>
              <h2>
                {exceptions ? "Trabajos por revisar" : chosen?.service.label ?? "Servicio no disponible"}
              </h2>
            </div>
            <Button variant="secondary" onClick={close}>
              Cerrar detalle
            </Button>
          </header>
          <div className={s.body}>
            {exceptions ? (
              <>
                {admin && <h3 className="font-bold">Por confirmar periodo</h3>}
                {admin && workList(needsReview, "No hay periodos pendientes de revisión.")}
                <h3 className="font-bold">Sin servicio contractual</h3>
                {workList(unlinked, "Todos los trabajos están relacionados.")}
              </>
            ) : (
              chosen ? (
                <>
                  <p className={s.muted}>Referencia contractual: {chosen.service.reference}</p>
                  {(w.contractPeriods ?? []).some(p => p.service_id === selected) && <label className={`${s.label} my-3`}>Periodos registrados
                    <select className={s.input} value={(w.contractPeriods ?? []).some(p => p.id === chosen.period?.id) ? chosen.period!.id : ""} onChange={event => {
                      const period = w.contractPeriods?.find(p => p.id === event.target.value && p.service_id === selected);
                      if (period) changeMonth(period.starts_on.slice(0,7));
                    }}>
                      <option value="" disabled>{chosen.period ? "Según fecha registrada · referencia confirmada" : "Sin periodo para el mes consultado"}</option>
                      {(w.contractPeriods ?? []).filter(p => p.service_id === selected).sort((a,b) => a.starts_on.localeCompare(b.starts_on)).map(p => <option key={p.id} value={p.id}>{periodLabel(p)}</option>)}
                    </select>
                  </label>}
                  <p className={s.muted}>
                    {chosen.period
                      ? periodLabel(chosen.period)
                      : "Periodo por confirmar"}{" "}
                    · {chosen.progress.ratio} trabajos entregados
                  </p>
                  {!chosen.period && <p className={s.muted}>La meta de referencia no se aplica a fechas no confirmadas.</p>}
                  {chosen.period && chosen.progress.target === null && <p className={s.muted}>No se calcula un porcentaje sin una cuota acordada.</p>}
                  {chosen.progress.excess > 0 && <p className={s.muted}>+{chosen.progress.excess} sobre la meta · sin traslado a otro periodo</p>}
                  <h3 className="mt-5 font-bold">
                    Entregas del periodo ({chosen.progress.delivered.length})
                  </h3>
                  {workList(
                    chosen.progress.delivered,
                    "No hay entregas en este periodo.",
                  )}
                  <details className={s.advanced}>
                    <summary>
                      Programadas o en proceso ({chosen.progress.pending.length}
                      )
                    </summary>
                    {workList(
                      chosen.progress.pending,
                      "No hay actividades pendientes en este periodo.",
                    )}
                  </details>
                  <details className={s.advanced}>
                    <summary>
                      No computables · todos los periodos (
                      {chosen.progress.excluded.length})
                    </summary>
                    {workList(
                      chosen.progress.excluded,
                      "No hay trabajos excluidos.",
                    )}
                  </details>
                  <details className={s.advanced}>
                    <summary>
                      Por confirmar periodo ({chosen.progress.unassigned.length}
                      )
                    </summary>
                    {workList(
                      chosen.progress.unassigned,
                      "No hay asignaciones pendientes.",
                    )}
                  </details>
                  {replacementsForService(w, selected).length > 0 && <details className={s.advanced}>
                    <summary>Reemplazos documentados ({replacementsForService(w, selected).length})</summary>
                    {replacementsForService(w, selected).map(r => <div key={r.id} className="my-3 rounded-md border border-line p-3 text-sm">
                      {renderReplacement ? renderReplacement(r) : <p>{r.original_title} → {r.substitute_title}</p>}
                      <Link className={s.link} href={admin ? activityHref(r.substitute_activity_id) : `/aunor/reemplazos/${r.id}`}>Ver original, sustituto y evidencia →</Link>
                    </div>)}
                  </details>}
                  {admin && <div className={s.config}>
                    <label className={s.label}>
                      Servicio para configurar
                      <select
                        className={s.input}
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                      >
                        {w.services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className={s.link}
                      type="button"
                      aria-expanded={config}
                      onClick={() => setConfig((v) => !v)}
                    >
                      {config
                        ? "Ocultar configuración"
                        : "Configurar periodos y metas"}
                    </button>
                    {config && management?.(selected)}
                  </div>}
                </>
              ) : <p className={s.muted}>El servicio ya no está disponible. Cierra el detalle para consultar la lista actualizada.</p>
            )}
          </div>
        </section>
      )}
      <details className={`${s.advanced} mb-4`}>
        <summary>Cómo se calcula el avance</summary>
        <p className={s.muted}>
          Solo suman actividades Entregadas, relacionadas al servicio,
          realizadas y no sustituidas. Una actividad cuenta una vez, aunque sea
          Especial. Se usa la fecha de realización o la entrega de Edición; una
          asignación explícita de Admin prevalece. No se trasladan excedentes
          entre meses. Los compromisos anuales se cuentan por su ciclo, no se
          reinician cada mes.
        </p>
      </details>
    </>
  );
}
