"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { StatusPill } from "@/components/status-pill";
import { safeMaterialUrl } from "@/lib/external-link";
import {
  actorFromRole,
  addInternalComment,
  advanceActivity,
  approveActivity,
  cancelActivity,
  deleteInternalComment,
  observeActivity,
  rejectActivity,
  respondToObservation,
  softDeleteActivity,
  useSimulatedActivities,
} from "@/lib/activity-simulation";
import type { Role } from "@/lib/roles";

function formatMoment(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
export function ActivityDetail({ id, role }: { id: string; role: Role }) {
  const activities = useSimulatedActivities();
  const activity = activities.find((item) => item.id === id && !item.deletedAt);
  const openedVersion = useRef<number | null>(null);
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState("");
  const [response, setResponse] = useState("");
  const [comment, setComment] = useState("");
  const [allowResend, setAllowResend] = useState(true);
  if (!activity)
    return (
      <Card className="p-6">
        <h2 className="font-bold">Actividad no encontrada</h2>
        <Link
          className="mt-3 inline-block text-blue underline"
          href="/actividades"
        >
          Volver
        </Link>
      </Card>
    );
  if (openedVersion.current === null) openedVersion.current = activity.version;
  const actor = actorFromRole(role);
  const canView =
    role.seesAllActivities || activity.responsibleAccountId === role.accountId;
  const responsible = activity.responsibleAccountId === role.accountId;
  const materialUrl = safeMaterialUrl(activity.materialLink);
  if (!canView)
    return (
      <Card className="border-red bg-red/5 p-6">
        <h2 className="font-bold text-red">
          No tienes permiso para ver esta actividad
        </h2>
      </Card>
    );
  function report(result: ReturnType<typeof approveActivity>, success: string) {
    setNotice(result.ok ? success : result.error);
    if (result.ok) openedVersion.current = result.activity.version;
  }
  return (
    <div className="space-y-3">
      {notice && (
        <p
          aria-live="polite"
          className="rounded-[5px] border border-blue bg-blue/10 p-3 text-sm font-bold"
        >
          {notice}
        </p>
      )}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-blue">
              {activity.type}
            </p>
            <h2 className="mt-1 text-lg font-bold">{activity.title}</h2>
          </div>
          <StatusPill status={activity.status} />
        </div>
        <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-2 border-t border-line pt-4 text-sm">
          <dt className="font-bold">Responsable</dt>
          <dd>{activity.responsible}</dd>
          <dt className="font-bold">Fecha</dt>
          <dd>{formatMoment(activity.dateTime)}</dd>
          <dt className="font-bold">Descripcion</dt>
          <dd>{activity.description || "Sin descripcion"}</dd>
          <dt className="font-bold">Avance</dt>
          <dd>{activity.progress ?? 0}%</dd>
          <dt className="font-bold">Lugar</dt>
          <dd>{activity.place}</dd>
        </dl>
        {materialUrl && (
          <a
            className="mt-4 block rounded-[5px] border border-line p-3 text-center text-sm font-bold text-blue"
            href={materialUrl}
            rel="noreferrer"
            target="_blank"
          >
            Abrir material en OneDrive
          </a>
        )}
        {activity.materialLink && !materialUrl && (
          <p className="mt-3 text-sm font-bold text-red">
            El enlace no es seguro.
          </p>
        )}
        {(role.createsOrders || role.supervises) &&
          activity.deliveryMessage && (
            <p className="mt-3 rounded-[5px] bg-panel-secondary p-3 text-sm">
              <strong>Mensaje privado:</strong> {activity.deliveryMessage}
            </p>
          )}
      </Card>

      {activity.rejection && (
        <Card className="border-red bg-red/5 p-3">
          <p className="font-bold text-red">
            Rechazo{" "}
            {activity.rejection.resendAllowed ? "con reenvio" : "definitivo"}
          </p>
          <p className="mt-1 text-sm">{activity.rejection.reason}</p>
        </Card>
      )}
      {activity.observations
        .filter((item) => !item.deletedAt)
        .map((item) => (
          <Card className="border-observed bg-red/5 p-3" key={item.id}>
            <p className="text-xs font-bold text-observed">
              Observacion de {item.createdBy}
            </p>
            <p className="mt-2 text-sm">{item.message}</p>
            {item.response && (
              <p className="mt-2 rounded-[5px] bg-panel p-2 text-sm">
                <strong>Respuesta:</strong> {item.response}
              </p>
            )}
            {responsible && !item.response && !item.resolvedAt && (
              <div className="mt-3 space-y-2">
                <textarea
                  className="min-h-20 w-full rounded-[5px] border border-line p-2"
                  onChange={(event) => setResponse(event.target.value)}
                  value={response}
                />
                <Button
                  className="w-full"
                  onClick={() => {
                    const result = respondToObservation(
                      window.localStorage,
                      id,
                      response,
                      actor,
                    );
                    report(
                      result,
                      "Respuesta guardada. Usa Reenviar cuando termines la correccion.",
                    );
                  }}
                >
                  Responder
                </Button>
              </div>
            )}
          </Card>
        ))}

      <Card className="p-3">
        <h2 className="font-bold">Comentarios internos</h2>
        <div className="mt-2 space-y-2">
          {activity.comments
            .filter((item) => !item.deletedAt)
            .map((item) => (
              <div
                className="rounded-[5px] bg-panel-secondary p-2 text-sm"
                key={item.id}
              >
                <p>{item.text}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {item.author.name} · {item.author.roleLabel}
                </p>
                {item.author.accountId === actor.accountId && (
                  <button
                    className="mt-1 text-xs font-bold text-red underline"
                    onClick={() =>
                      report(
                        deleteInternalComment(
                          window.localStorage,
                          id,
                          item.id,
                          actor,
                        ),
                        "Comentario eliminado.",
                      )
                    }
                    type="button"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="min-h-11 flex-1 rounded-[5px] border border-line px-3 text-sm"
            onChange={(event) => setComment(event.target.value)}
            placeholder="Comentario visible para el equipo"
            value={comment}
          />
          <Button
            onClick={() => {
              const result = addInternalComment(
                window.localStorage,
                id,
                comment,
                actor,
              );
              report(result, "Comentario agregado.");
              if (result.ok) setComment("");
            }}
          >
            Comentar
          </Button>
        </div>
      </Card>

      {responsible &&
        !["Aprobada", "Cancelada"].includes(activity.status) &&
        !(
          activity.status === "Rechazada" && !activity.rejection?.resendAllowed
        ) && (
          <div className="grid grid-cols-2 gap-2">
            <Link
              className="flex min-h-11 items-center justify-center rounded-[5px] border border-line font-bold text-blue"
              href={`/actividades/nueva?editar=${activity.id}`}
            >
              Editar reporte
            </Link>
            <Button
              onClick={() =>
                report(
              advanceActivity(window.localStorage, id, actor, activity.version),
                  activity.status === "Observada" ||
                    activity.status === "Rechazada"
                    ? "Material reenviado."
                    : "Estado actualizado.",
                )
              }
            >
              {activity.status === "Observada" ||
              activity.status === "Rechazada"
                ? "Reenviar"
                : "Avanzar"}
            </Button>
          </div>
        )}

      {role.supervises && activity.status === "Entregada" && (
        <Card className="space-y-3 p-3">
          <h2 className="font-bold">Evaluacion de Supervision</h2>
          <textarea
            className="min-h-20 w-full rounded-[5px] border border-line p-2"
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motivo obligatorio para observar o rechazar"
            value={reason}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={allowResend}
              onChange={(event) => setAllowResend(event.target.checked)}
              type="checkbox"
            />{" "}
            Permitir un nuevo envio si se rechaza
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() =>
                report(
                  observeActivity(
                    window.localStorage,
                    id,
                    reason,
                    actor,
                    openedVersion.current ?? undefined,
                  ),
                  "Actividad observada.",
                )
              }
              variant="secondary"
            >
              Observar
            </Button>
            <Button
              onClick={() =>
                report(
                  rejectActivity(
                    window.localStorage,
                    id,
                    reason,
                    allowResend,
                    actor,
                    openedVersion.current ?? undefined,
                  ),
                  "Actividad rechazada.",
                )
              }
              variant="secondary"
            >
              Rechazar
            </Button>
            <Button
              onClick={() =>
                report(
                  approveActivity(
                    window.localStorage,
                    id,
                    actor,
                    openedVersion.current ?? undefined,
                  ),
                  "Actividad aprobada.",
                )
              }
            >
              Aprobar
            </Button>
          </div>
        </Card>
      )}

      {role.createsOrders && activity.status !== "Aprobada" && (
        <Card className="space-y-3 p-3">
          <h2 className="font-bold">Administracion de la orden</h2>
          <textarea
            className="min-h-20 w-full rounded-[5px] border border-line p-2"
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motivo obligatorio"
            value={reason}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() =>
                report(
                  cancelActivity(window.localStorage, id, reason, actor),
                  "Actividad cancelada.",
                )
              }
              variant="secondary"
            >
              Cancelar
            </Button>
            {activity.status === "Programada" && !activity.startedAt && (
              <Button
                onClick={() =>
                  report(
                    softDeleteActivity(window.localStorage, id, reason, actor),
                    "Orden eliminada logicamente.",
                  )
                }
                variant="secondary"
              >
                Eliminar
              </Button>
            )}
          </div>
        </Card>
      )}

      <Card className="p-3">
        <h2 className="font-bold">Trazabilidad</h2>
        <div className="mt-2 space-y-2">
          {activity.history.map((entry, index) => (
            <div
              className="flex items-center justify-between border-t border-line pt-2 text-xs"
              key={`${entry.moment}-${index}`}
            >
              <StatusPill status={entry.status} />
              <span className="text-right text-ink-muted">
                {entry.actor}
                <br />
                {formatMoment(entry.moment)}
                {entry.reason && (
                  <>
                    <br />
                    {entry.reason}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
        {activity.fieldHistory.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-bold text-blue">
              Versiones de entrega ({activity.fieldHistory.length})
            </summary>
            {activity.fieldHistory.map((item, index) => (
              <p className="mt-2 text-xs" key={`${item.moment}-${index}`}>
                <strong>{item.field}</strong> · {item.actor.name} ·{" "}
                {formatMoment(item.moment)}
              </p>
            ))}
          </details>
        )}
      </Card>
    </div>
  );
}
