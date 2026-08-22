"use client";

import Link from "next/link";
import { useState } from "react";
import { formatActivityDates } from "@/components/activity-card";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { StatusPill } from "@/components/status-pill";
import { SystemIcon } from "@/components/system-icon";
import {
  actorFromRole,
  addThreadMessage,
  advanceActivity,
  canEditActivity,
  canViewActivity,
  deleteThreadMessage,
  editThreadMessage,
  softDeleteActivity,
  useSimulatedActivities,
} from "@/lib/activity-simulation";
import { safeMaterialUrl, safeReferenceUrl } from "@/lib/external-link";
import type { Role } from "@/lib/roles";

function moment(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

export function ActivityDetail({ id, role }: { id: string; role: Role }) {
  const item = useSimulatedActivities().find(
    (activity) => activity.id === id && !activity.deletedAt,
  );
  const [notice, setNotice] = useState("");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");

  if (!item) return <Card className="p-6">Actividad no encontrada.</Card>;
  if (!canViewActivity(item, role))
    return (
      <Card className="border-red bg-red/5 p-6 font-bold text-red">
        No tienes permiso para ver esta actividad.
      </Card>
    );

  const actor = actorFromRole(role);
  const responsible =
    role.id === "operario" && item.responsibleAccountId === role.accountId;
  const canEdit = canEditActivity(item, role);
  const canDelete = role.id === "admin" || canEdit;
  const canThread = role.id === "admin" || responsible;
  const url = safeMaterialUrl(item.materialLink);
  const referenceUrl = safeReferenceUrl(item.referenceLink);
  const visibleAudit =
    role.id === "burson"
      ? item.audit.filter(
          (entry) => !/conversación|mensaje/i.test(entry.action),
        )
      : item.audit;
  const report = (
    result: ReturnType<typeof advanceActivity>,
    success: string,
  ) => setNotice(result.ok ? success : result.error);

  return (
    <div className="space-y-4">
      {notice && (
        <p
          aria-live="polite"
          className="rounded-md border border-cyan/40 bg-cyan/10 p-3 text-sm font-bold text-ink shadow-[var(--shadow-1)]"
        >
          {notice}
        </p>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="overflow-hidden shadow-[var(--shadow-2)]">
          <div className="technical-surface px-5 py-5 text-white md:px-6 md:py-6">
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="data-label text-cyan">
                  {item.type}
                  {item.origin === "burson"
                    ? " · Canal Burson"
                    : " · Producción propia"}
                </p>
                <h2 className="display-title mt-2 text-2xl leading-tight md:text-3xl">
                  {item.title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/68">
                  Ficha única de ejecución, entrega y trazabilidad de la
                  actividad.
                </p>
              </div>
              <StatusPill status={item.status} />
            </div>
          </div>

          <div className="grid border-b border-line sm:grid-cols-3">
            <Datum
              icon="profile"
              label="Responsable"
              value={item.responsible}
            />
            <Datum
              icon="calendar"
              label="Jornadas"
              value={formatActivityDates(item)}
            />
            <Datum
              icon="location"
              label="Lugar"
              value={item.place || "Sin lugar indicado"}
            />
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            <section className="p-5 md:border-r md:border-line md:p-6">
              <p className="data-label text-cyan-ink">Alcance</p>
              <h3 className="section-title mt-1 text-lg">Descripción</h3>
              <p className="mt-4 text-sm leading-6 text-ink-muted">
                {item.description}
              </p>
            </section>
            <section className="border-t border-line p-5 md:border-t-0 md:p-6">
              <p className="data-label text-cyan-ink">Cierre del operario</p>
              <h3 className="section-title mt-1 text-lg">Opinión de entrega</h3>
              <p
                className={`mt-4 rounded-md border-l-4 p-4 text-sm leading-6 ${item.operatorOpinion ? "border-lime bg-lime/[.08] text-ink" : "border-line bg-panel-secondary text-ink-muted"}`}
              >
                {item.operatorOpinion ||
                  "Todavía no se registró una opinión sobre esta entrega."}
              </p>
            </section>
          </div>
        </Card>

        <aside className="space-y-3 xl:sticky xl:top-5">
          <Card className="overflow-hidden shadow-[var(--shadow-2)]">
            <div className="h-1 bg-gradient-to-r from-cyan to-lime" />
            <div className="p-4">
              <p className="data-label text-cyan-ink">Acciones</p>
              <h3 className="section-title mt-1 text-lg">Material y estado</h3>
              <div className="mt-4 grid gap-2">
                {url ? (
                  <a
                    className="action-surface flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-extrabold text-[#173000] shadow-[0_7px_18px_rgba(95,170,0,.2)]"
                    href={url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <SystemIcon className="size-4" name="link" /> Abrir OneDrive
                    ↗
                  </a>
                ) : (
                  <p className="rounded-md border border-dashed border-cyan/60 bg-cyan/5 p-3 text-center text-xs font-bold text-ink-muted">
                    El enlace aparecerá al entregar.
                  </p>
                )}
                {referenceUrl && (
                  <a
                    className="flex min-h-11 items-center justify-center text-center text-xs font-bold text-[#08718a] underline decoration-cyan underline-offset-4"
                    href={referenceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir referencia de Burson ↗
                  </a>
                )}
              </div>

              {canEdit && (
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4">
                  <Link
                    className="flex min-h-11 items-center justify-center rounded-md border border-line bg-panel text-sm font-extrabold text-ink transition hover:border-cyan"
                    href={`/actividades/nueva?editar=${item.id}`}
                  >
                    Editar
                  </Link>
                  {responsible && item.status !== "Entregada" ? (
                    <Button
                      onClick={() =>
                        report(
                          advanceActivity(
                            window.localStorage,
                            item.id,
                            actor,
                            item.version,
                          ),
                          item.status === "Programada"
                            ? "Actividad iniciada."
                            : "Actividad entregada.",
                        )
                      }
                    >
                      {item.status === "Programada" ? "Iniciar" : "Entregar"}
                    </Button>
                  ) : (
                    <span />
                  )}
                </div>
              )}
            </div>
          </Card>

          {canDelete && (
            <Card className="overflow-hidden">
              <details className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-xs font-extrabold text-ink-muted">
                  <span>Administrar registro</span>
                  <span className="text-base transition group-open:rotate-45">
                    ＋
                  </span>
                </summary>
                <div className="border-t border-line p-4">
                  <p className="text-xs leading-5 text-ink-muted">
                    La eliminación es lógica y conserva toda la auditoría.
                  </p>
                  <textarea
                    className="mt-3 min-h-20 w-full rounded-md border border-line p-3 text-sm outline-none focus:border-cyan"
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Motivo obligatorio"
                    value={reason}
                  />
                  <Button
                    className="mt-2 w-full text-red"
                    onClick={() =>
                      report(
                        softDeleteActivity(
                          window.localStorage,
                          item.id,
                          reason,
                          actor,
                        ),
                        "Actividad eliminada lógicamente.",
                      )
                    }
                    variant="secondary"
                  >
                    Eliminar actividad
                  </Button>
                </div>
              </details>
            </Card>
          )}
        </aside>
      </div>

      {canThread && item.status === "Entregada" && (
        <Card className="overflow-hidden shadow-[var(--shadow-2)]">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4 md:p-5">
            <div>
              <p className="data-label text-cyan-ink">Comunicación interna</p>
              <h2 className="section-title mt-1 text-xl">
                Conversación con Admin
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[0.6875rem] font-extrabold ${item.threadOpenedAt ? "bg-orange/15 text-[#8a5200]" : "bg-panel-secondary text-ink-muted"}`}
            >
              {item.threadOpenedAt ? "ENTREGA BLOQUEADA" : "SIN INICIAR"}
            </span>
            <p className="w-full text-xs leading-5 text-ink-muted">
              {item.threadOpenedAt
                ? "La entrega está bloqueada; la conversación permanece abierta."
                : role.id === "admin"
                  ? "Tu primer mensaje bloqueará el enlace y la opinión inicial."
                  : "Admin todavía no inició la conversación."}
            </p>
          </header>
          <div className="space-y-2 bg-paper/55 p-4 md:p-5">
            {item.thread
              .filter((entry) => !entry.deletedAt)
              .map((entry) => (
                <div
                  className={`max-w-[46rem] rounded-md border p-3 text-sm ${entry.author.roleId === "admin" ? "ml-auto border-cyan/30 bg-cyan/10" : "border-line bg-panel"}`}
                  key={entry.id}
                >
                  <p className="leading-6">{entry.text}</p>
                  <p className="mt-2 data-label text-ink-muted">
                    {entry.author.name} · {moment(entry.createdAt)}
                    {entry.editedAt ? " · editado" : ""}
                  </p>
                  {entry.author.accountId === actor.accountId && (
                    <div className="mt-2 flex gap-3 text-xs font-bold">
                      <button
                        className="text-[#08718a] underline"
                        onClick={() => {
                          const next = window.prompt(
                            "Editar mensaje",
                            entry.text,
                          );
                          if (next !== null)
                            report(
                              editThreadMessage(
                                window.localStorage,
                                item.id,
                                entry.id,
                                next,
                                actor,
                              ),
                              "Mensaje editado.",
                            );
                        }}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className="text-red underline"
                        onClick={() =>
                          report(
                            deleteThreadMessage(
                              window.localStorage,
                              item.id,
                              entry.id,
                              actor,
                            ),
                            "Mensaje eliminado.",
                          )
                        }
                        type="button"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
          {(role.id === "admin" || item.threadOpenedAt) && (
            <div className="flex flex-col gap-2 border-t border-line p-4 sm:flex-row md:p-5">
              <label className="flex-1">
                <span className="sr-only">Mensaje</span>
                <input
                  className="min-h-11 w-full rounded-md border border-line px-3 text-sm outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/15"
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Escribe un mensaje para el responsable"
                  value={message}
                />
              </label>
              <Button
                onClick={() => {
                  const result = addThreadMessage(
                    window.localStorage,
                    item.id,
                    message,
                    actor,
                  );
                  report(result, "Mensaje publicado.");
                  if (result.ok) setMessage("");
                }}
              >
                Enviar mensaje
              </Button>
            </div>
          )}
        </Card>
      )}

      <Card className="overflow-hidden">
        <details>
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 text-sm font-extrabold md:px-5">
            <span>Trazabilidad completa</span>
            <span className="data-label text-ink-muted">
              {visibleAudit.length} EVENTOS
            </span>
          </summary>
          <div className="border-t border-line bg-panel-secondary/55 px-4 py-2 md:px-5">
            {visibleAudit.map((entry, index) => (
              <div
                className="grid grid-cols-[auto_1fr] gap-3 border-b border-line py-3 last:border-b-0"
                key={`${entry.moment}-${index}`}
              >
                <span className="mt-1 size-2 rounded-full bg-cyan ring-4 ring-cyan/10" />
                <p className="text-xs">
                  <strong>{entry.action}</strong>
                  <br />
                  <span className="leading-5 text-ink-muted">
                    {entry.actor.name} · {moment(entry.moment)}
                    {entry.detail ? ` · ${entry.detail}` : ""}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </details>
      </Card>
    </div>
  );
}

function Datum({
  icon,
  label,
  value,
}: {
  icon: "profile" | "calendar" | "location";
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-line p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 md:px-5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cyan/12 text-[#08718a]">
        <SystemIcon className="size-4" name={icon} />
      </span>
      <div className="min-w-0">
        <p className="data-label text-ink-muted">{label}</p>
        <p className="mt-1 truncate text-xs font-extrabold" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}
