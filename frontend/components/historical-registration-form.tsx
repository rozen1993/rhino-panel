"use client";
import { useMemo, useRef, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerHistoricalAction } from "@/app/actividades/registro-historico/actions";
import type { AunorWorkspace } from "@/lib/aunor";
import type { AssignableOperator } from "@/lib/accounts";
import { useAccounts } from "@/lib/account-store";
import type { Role } from "@/lib/roles";
import { activityTypes } from "@/lib/roles";
import type { DataSource } from "@/lib/data-source";
import {
  historicalRegistrationError,
  historicalPreview,
  type HistoricalRegistration,
} from "@/lib/historical-registration";
import { calendarDateInLima } from "@/lib/historical";
import { createIdempotencyKey } from "@/lib/activity-draft";
import { rememberDemoHistorical } from "@/lib/activity-simulation";
import { RecordingModePicker } from "./recording-mode-picker";
import { ClassificationPicker } from "./classification-picker";
import { StatusPill } from "./status-pill";
import { Button } from "./button";
import { periodLabel } from "@/lib/contract-progress";
import s from "./admin-workspace.module.css";

const empty: HistoricalRegistration = {
  type: "Grabación",
  title: "",
  description: "",
  placeName: "",
  responsibleAccountId: "",
  spans: [{ start: "", end: "" }],
  deliveryDueOn: "",
  recordingModes: [],
  classification: "standard",
  materialLink: "",
  notes: "",
  referenceLink: "",
  serviceId: "",
  confirmed: false,
};
export function HistoricalRegistrationForm({
  role,
  dataSource,
  operators,
  workspace,
}: {
  role: Role;
  dataSource: DataSource;
  operators: AssignableOperator[];
  workspace: AunorWorkspace;
}) {
  const demo = useAccounts();
  const router = useRouter();
  const people = useMemo(
    () =>
      dataSource === "supabase"
        ? operators
        : demo.filter((a) => a.active && a.roleId === "operario"),
    [dataSource, operators, demo],
  );
  const [fields, setFields] = useState<HistoricalRegistration>(empty),
    [review, setReview] = useState(false),
    [notice, setNotice] = useState(""),
    [saved, setSaved] = useState(""),
    [pending, transition] = useTransition();
  const [uncertain, setUncertain] = useState(false);
  const requestId = useRef(createIdempotencyKey()),
    dirty = useRef(false),
    reviewHeading = useRef<HTMLHeadingElement>(null);
  const editing = fields.type === "Edición",
    date = editing ? fields.deliveryDueOn! : fields.spans[0].start;
  const dateLabel = editing
    ? "Fecha de entrega del proyecto"
    : "Fecha de realización";
  const maxDate = new Date(
    Date.parse(calendarDateInLima() + "T12:00:00Z") - 86400000,
  )
    .toISOString()
    .slice(0, 10);
  const preview = historicalPreview(workspace, fields);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  useEffect(() => {
    if (review) reviewHeading.current?.focus();
  }, [review]);
  const change = (patch: Partial<HistoricalRegistration>) => {
    dirty.current = true;
    setFields((f) => ({ ...f, ...patch, confirmed: false }));
  };
  function save() {
    if (pending || saved) return;
    const error = historicalRegistrationError(fields);
    if (error) {
      setNotice(error);
      return;
    }
    transition(async () => {
      try {
        const result = await registerHistoricalAction(
          fields,
          requestId.current,
        );
        if (!result.ok) {
          setNotice(result.error);
          setUncertain("uncertain" in result && result.uncertain === true);
          return;
        }
        dirty.current = false;
        setSaved(result.activityId);
        setNotice("Trabajo histórico registrado como Entregada.");
        if (dataSource === "demo" && result.activity) {
          try {
            rememberDemoHistorical(window.localStorage, result.activity);
          } catch {
            setNotice(
              "Registro confirmado. El navegador no pudo actualizar su copia de demostración.",
            );
          }
        }
      } catch {
        setNotice(
          "No se pudo confirmar la respuesta. Reintenta sin cambiar el formulario; se usará la misma solicitud.",
        );
        setUncertain(true);
      }
    });
  }
  if (role.id !== "admin")
    return <p>No tienes acceso al registro histórico.</p>;
  return (
    <>
      {notice && (
        <p role="status" className={s.notice}>
          {notice}
        </p>
      )}
      {saved ? (
        <section className={s.panel}>
          <div className={s.body}>
            <h2 className="display-title text-2xl">Registro completado</h2>
            <p className="my-3 text-sm">
              El trabajo conserva su fecha y ya está terminado. No necesitas
              entrar en la cuenta del Operario.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link className={s.link} href={`/actividades/${saved}`}>
                Ver ficha del trabajo
              </Link>
              <Link
                className={s.link}
                href={`/contrato?mes=${date.slice(0, 7)}`}
              >
                Ver centro de contrato
              </Link>
              <button
                className={s.link}
                onClick={() => {
                  requestId.current = createIdempotencyKey();
                  dirty.current = false;
                  setFields(empty);
                  setReview(false);
                  setNotice("");
                  setUncertain(false);
                  setSaved("");
                  router.refresh();
                }}
              >
                Registrar otro trabajo
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className={s.layout}>
          <section className={s.panel}>
            <header className={s.head}>
              <div>
                <p className="data-label text-cyan-ink">
                  Archivo de producción
                </p>
                <h2 ref={reviewHeading} tabIndex={-1}>
                  {review
                    ? "Revisar trabajo terminado"
                    : "Registrar trabajo terminado"}
                </h2>
                <p>Solo Admin · no envía tareas nuevas al Operario</p>
              </div>
              <StatusPill status="Entregada" />
            </header>
            {review ? (
              <div className={s.body}>
                <h3 className="display-title text-2xl">{fields.title}</h3>
                <dl className={s.facts}>
                  <div>
                    <dt>Tipo de servicio</dt>
                    <dd>{fields.type}</dd>
                  </div>
                  <div>
                    <dt>{dateLabel}</dt>
                    <dd>
                      {editing
                        ? date
                        : fields.spans
                            .map((p) =>
                              p.start === p.end
                                ? p.start
                                : `${p.start} — ${p.end}`,
                            )
                            .join(" · ")}
                    </dd>
                  </div>
                  <div>
                    <dt>Responsable</dt>
                    <dd>
                      {
                        people.find((p) => p.id === fields.responsibleAccountId)
                          ?.name
                      }
                    </dd>
                  </div>
                  <div>
                    <dt>Material final</dt>
                    <dd>{fields.materialLink}</dd>
                  </div>
                  <div>
                    <dt>Clasificación</dt>
                    <dd>
                      {fields.classification === "special"
                        ? "Especial"
                        : "Estándar"}
                    </dd>
                  </div>
                </dl>
                <label className={s.check}>
                  <input
                    type="checkbox"
                    checked={fields.confirmed}
                    disabled={pending || uncertain}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, confirmed: e.target.checked }))
                    }
                  />
                  Confirmo que este trabajo ya fue terminado y entregado. La
                  fecha registrada corresponde al trabajo, no a su carga.
                </label>
                {uncertain && (
                  <p className={s.note}>
                    Conservamos la solicitud para reintentar sin duplicar. Si
                    necesitas cambiar los datos, revisa primero si el trabajo ya
                    aparece en tu panel.
                  </p>
                )}
                <div className={s.actions}>
                  <Button
                    variant="secondary"
                    disabled={pending || uncertain}
                    onClick={() => {
                      setReview(false);
                      setFields((f) => ({ ...f, confirmed: false }));
                    }}
                  >
                    Volver al formulario
                  </Button>
                  <Button
                    disabled={pending || !fields.confirmed}
                    onClick={save}
                  >
                    {pending
                      ? "Registrando…"
                      : uncertain
                        ? "Reintentar registro"
                        : "Confirmar registro histórico"}
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className={s.body}
                onSubmit={(e) => {
                  e.preventDefault();
                  const error = historicalRegistrationError({
                    ...fields,
                    confirmed: true,
                  });
                  if (error) {
                    setNotice(error);
                    return;
                  }
                  setNotice("");
                  setReview(true);
                }}
              >
                <div className={s.fields}>
                  <label className={`${s.label} ${s.full}`}>
                    Nombre del trabajo
                    <input
                      className={s.input}
                      required
                      maxLength={180}
                      minLength={2}
                      value={fields.title}
                      onChange={(e) => change({ title: e.target.value })}
                    />
                  </label>
                  <label className={s.label}>
                    Tipo de servicio
                    <select
                      className={s.input}
                      value={fields.type}
                      onChange={(e) => {
                        const type = e.target
                          .value as HistoricalRegistration["type"];
                        change({
                          type,
                          recordingModes:
                            type === "Grabación" ? fields.recordingModes : [],
                          deliveryDueOn: type === "Edición" ? date : "",
                          spans:
                            type === "Edición"
                              ? []
                              : [{ start: date, end: date }],
                          description:
                            type === "Edición" ? "" : fields.description,
                          placeName: type === "Edición" ? "" : fields.placeName,
                        });
                      }}
                    >
                      {activityTypes.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label className={s.label}>
                    {dateLabel}
                    <input
                      className={s.input}
                      type="date"
                      min="2026-01-01"
                      max={maxDate}
                      required
                      value={date}
                      onChange={(e) =>
                        change(
                          editing
                            ? { deliveryDueOn: e.target.value }
                            : {
                                spans: [
                                  {
                                    ...fields.spans[0],
                                    start: e.target.value,
                                    end: e.target.value,
                                  },
                                  ...fields.spans.slice(1),
                                ],
                              },
                        )
                      }
                    />
                  </label>
                  <p className={`${s.note} ${s.full}`}>
                    Esta fecha ubica el trabajo en el histórico y el contrato.
                    No necesitas una fecha de entrega adicional.
                  </p>
                  {fields.type === "Grabación" && (
                    <div className={s.full}>
                      <RecordingModePicker
                        value={fields.recordingModes ?? []}
                        onChange={(recordingModes) =>
                          change({ recordingModes })
                        }
                      />
                    </div>
                  )}
                  <label className={s.label}>
                    Responsable
                    <select
                      className={s.input}
                      required
                      value={fields.responsibleAccountId}
                      onChange={(e) =>
                        change({ responsibleAccountId: e.target.value })
                      }
                    >
                      <option value="">Seleccionar operario</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={s.label}>
                    Servicio del contrato
                    <select
                      className={s.input}
                      value={fields.serviceId}
                      onChange={(e) => change({ serviceId: e.target.value })}
                    >
                      <option value="">Sin relacionar por ahora</option>
                      {workspace.services.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!editing && (
                    <>
                      <label className={`${s.label} ${s.full}`}>
                        Lugar o referencia
                        <input
                          className={s.input}
                          maxLength={300}
                          value={fields.placeName}
                          onChange={(e) =>
                            change({ placeName: e.target.value })
                          }
                        />
                      </label>
                      <label className={`${s.label} ${s.full}`}>
                        Descripción
                        <textarea
                          className={s.input}
                          required
                          minLength={2}
                          maxLength={5000}
                          rows={3}
                          value={fields.description}
                          onChange={(e) =>
                            change({ description: e.target.value })
                          }
                        />
                      </label>
                    </>
                  )}
                  <label className={`${s.label} ${s.full}`}>
                    Material final · enlace HTTPS
                    <input
                      className={s.input}
                      type="url"
                      required
                      maxLength={3000}
                      value={fields.materialLink}
                      placeholder="https://…"
                      onChange={(e) => change({ materialLink: e.target.value })}
                    />
                  </label>
                  <div className={s.full}>
                    <ClassificationPicker
                      value={fields.classification ?? null}
                      onChange={(classification) => change({ classification })}
                    />
                  </div>
                </div>
                {!editing && (
                  <details className={s.advanced}>
                    <summary>El trabajo tuvo varias jornadas</summary>
                    <p className={s.muted}>
                      Solo fechas de realización; no añaden fechas de entrega ni
                      duplican el conteo.
                    </p>
                    {fields.spans.map((span, i) => (
                      <div key={i} className={s.journey}>
                        <label className={s.label}>
                          Inicio de jornada {i + 1}
                          <input
                            type="date"
                            className={s.input}
                            min="2026-01-01"
                            max={maxDate}
                            required
                            value={span.start}
                            onChange={(e) =>
                              change({
                                spans: fields.spans.map((v, n) =>
                                  n === i ? { ...v, start: e.target.value } : v,
                                ),
                              })
                            }
                          />
                        </label>
                        <label className={s.label}>
                          Fin de jornada {i + 1}
                          <input
                            type="date"
                            className={s.input}
                            min={span.start || "2026-01-01"}
                            max={maxDate}
                            required
                            value={span.end}
                            onChange={(e) =>
                              change({
                                spans: fields.spans.map((v, n) =>
                                  n === i ? { ...v, end: e.target.value } : v,
                                ),
                              })
                            }
                          />
                        </label>
                        {i > 0 && (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              change({
                                spans: fields.spans.filter((_, n) => n !== i),
                              })
                            }
                          >
                            Quitar jornada {i + 1}
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      disabled={fields.spans.length >= 100}
                      onClick={() =>
                        change({
                          spans: [...fields.spans, { start: date, end: date }],
                        })
                      }
                    >
                      Añadir jornada
                    </Button>
                  </details>
                )}
                <div className={s.actions}>
                  <Link className={s.link} href="/actividades">
                    Cancelar
                  </Link>
                  <Button type="submit">Revisar antes de registrar</Button>
                </div>
              </form>
            )}
          </section>
          <aside
            className={`${s.panel} ${s.preview}`}
            aria-label="Vista previa contractual"
          >
            <p className="data-label text-cyan-ink">Vista previa</p>
            <h2>
              {preview
                ? periodLabel(preview.label)
                : date
                  ? date.slice(0, 7)
                  : "Elige la fecha"}
            </h2>
            <p className={s.muted}>Mismo mes en histórico y contrato</p>
            <dl className={s.facts}>
              <div>
                <dt>Servicio</dt>
                <dd>
                  {workspace.services.find((p) => p.id === fields.serviceId)
                    ?.label ?? "Sin relacionar"}
                </dd>
              </div>
              <div>
                <dt>Estado al registrar</dt>
                <dd>
                  <StatusPill status="Entregada" />
                </dd>
              </div>
            </dl>
            {preview ? (
              <>
                <p className="data-label text-cyan-ink">
                  Así quedaría el avance
                </p>
                <p className={s.ratio}>
                  {preview.before}
                  <small>/{preview.target ?? "—"}</small> → {preview.after}
                  <small>/{preview.target ?? "—"}</small>
                </p>
                <p className={s.muted}>
                  Vista previa; el conteo se actualiza después de guardar.
                </p>
              </>
            ) : (
              <p className={s.muted}>
                {fields.serviceId
                  ? "Revisa las fechas. Si cruzan periodos, Admin deberá indicar el correspondiente."
                  : "Relaciona un servicio para ver cómo sumará al contrato."}
              </p>
            )}
            <p className={`${s.note} mt-4`}>
              Se conserva la fecha registrada, aunque cargues el trabajo hoy. No
              se cambia ninguna actividad anterior.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
