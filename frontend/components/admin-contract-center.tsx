"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAunorWorkspace } from "@/lib/use-aunor-workspace";
import type { AunorActivityRow, AunorWorkspace } from "@/lib/aunor";
import {
  contractPeriodForMonth,
  activityContractPeriod,
} from "@/lib/contract-calendar";
import { contractProgress, periodLabel } from "@/lib/contract-progress";
import { contractReferences } from "@/lib/contract-reference";
import { AdminContractPeriod } from "./admin-contract-period";
import { Button } from "./button";
import { StatusPill } from "./status-pill";
import { SystemIcon } from "./system-icon";
import s from "./admin-workspace.module.css";

export function AdminContractCenter({
  initial,
  initialMonth,
}: {
  initial: AunorWorkspace;
  initialMonth: string;
}) {
  const { w, error, refresh } = useAunorWorkspace(initial, "acordado", "");
  const [month, setMonth] = useState(initialMonth),
    [cadence, setCadence] = useState<"monthly" | "annual">("monthly");
  const [selected, setSelected] = useState(""),
    [config, setConfig] = useState(false),
    [exceptions, setExceptions] = useState(false);
  const detail = useRef<HTMLElement>(null),
    lastTrigger = useRef<HTMLButtonElement | null>(null);
  const entries = useMemo(
    () =>
      w.services.map((service) => {
        const period = contractPeriodForMonth(w, service.id, month);
        return {
          service,
          period,
          cadence: period?.cadence ?? contractReferences[service.id]?.cadence,
          progress: contractProgress(w, service.id, period),
        };
      }),
    [w, month],
  );
  const chosen = entries.find((e) => e.service.id === selected);
  const replaced = new Set(
    w.replacements
      .filter((r) => r.is_current)
      .map((r) => r.original_activity_id),
  );
  const needsReview = w.activities.filter(
    (a) =>
      a.service_id &&
      !a.not_performed_reason &&
      !replaced.has(a.id) &&
      !activityContractPeriod(w, a),
  );
  const unlinked = w.activities.filter((a) => !a.service_id);
  const returnTo = `/contrato?mes=${month}`;
  useEffect(() => {
    if (selected || exceptions) {
      detail.current?.focus();
      detail.current?.scrollIntoView({ block: "nearest" });
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
  function workList(items: AunorActivityRow[], empty: string) {
    return items.length ? (
      <ul className={s.list}>
        {items.map((a) => (
          <li key={a.id}>
            <div>
              <Link
                href={`/actividades/${a.id}?volver=${encodeURIComponent(returnTo)}`}
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
      {error && (
        <div role="alert" className={s.notice}>
          {error}
          <Button variant="secondary" onClick={() => void refresh(true)}>
            Reintentar carga
          </Button>
        </div>
      )}
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
            onChange={(e) => {
              if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(e.target.value)) return;
              setMonth(e.target.value);
              window.history.replaceState(
                null,
                "",
                `/contrato?mes=${e.target.value}`,
              );
            }}
          />
        </label>
        <Button
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
        </Button>
      </div>
      <div className={s.note}>
        <strong>Una fecha de referencia para histórico y contrato</strong>
        <p>
          Grabación, locución y creatividad: realización. Edición: entrega del
          proyecto.
        </p>
        <p className="mt-1">
          La fecha de carga no cambia el mes del trabajo. Se conservan las
          asignaciones explícitas de Admin.
        </p>
      </div>
      <section
        className={s.grid}
        aria-label={
          cadence === "monthly" ? "Servicios mensuales" : "Servicios anuales"
        }
      >
        {entries
          .filter((e) => e.cadence === cadence)
          .map(({ service, period, progress }) => {
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
                    {reached
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
      <section className={s.panel}>
        <div className={s.row}>
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
        </div>
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
      {(chosen || exceptions) && (
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
              <p className="data-label text-cyan-ink">Gestión contractual</p>
              <h2>
                {exceptions ? "Trabajos por revisar" : chosen!.service.label}
              </h2>
            </div>
            <Button variant="secondary" onClick={close}>
              Cerrar detalle
            </Button>
          </header>
          <div className={s.body}>
            {exceptions ? (
              <>
                <h3 className="font-bold">Por confirmar periodo</h3>
                {workList(
                  needsReview,
                  "No hay periodos pendientes de revisión.",
                )}
                <h3 className="font-bold">Sin servicio contractual</h3>
                {workList(unlinked, "Todos los trabajos están relacionados.")}
              </>
            ) : (
              chosen && (
                <>
                  <p className={s.muted}>
                    {chosen.period
                      ? periodLabel(chosen.period)
                      : "Periodo por confirmar"}{" "}
                    · {chosen.progress.ratio} trabajos entregados
                  </p>
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
                  <div className={s.config}>
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
                    {config && (
                      <AdminContractPeriod
                        key={selected}
                        w={w}
                        activityId=""
                        activityVersion={0}
                        serviceOverride={selected}
                        configOnly
                        onAssigned={() => {}}
                        onRefresh={() => refresh(true)}
                      />
                    )}
                  </div>
                </>
              )
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
