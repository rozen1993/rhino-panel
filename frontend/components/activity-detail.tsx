"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/card";
import { StatusPill } from "@/components/status-pill";
import { SystemIcon } from "@/components/system-icon";
import { advanceActivity, deleteObservationText, editObservationText, nextActivityStatus, respondToObservation, useSimulatedActivities } from "@/lib/activity-simulation";
import type { Role } from "@/lib/roles";
import { safeMaterialUrl } from "@/lib/external-link";

function formatMoment(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ActivityDetail({ id, role }: { id: string; role: Role }) {
  const [response, setResponse] = useState("");
  const [message, setMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<{ id: string; field: "message" | "response" } | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingMessage, setDeletingMessage] = useState<{ id: string; field: "message" | "response" } | null>(null);
  const activities = useSimulatedActivities();
  const activity = activities.find((item) => item.id === id);
  if (!activity) return <Card className="p-6 text-center"><h2 className="font-bold">Actividad no encontrada</h2><p className="mt-2 text-sm text-ink-muted">Puede haber sido creada en otro navegador o eliminada del almacenamiento local.</p><Link className="mt-4 inline-block text-sm font-bold text-blue underline" href="/actividades">Volver a actividades</Link></Card>;
  const canView = role.seesAllActivities || (role.kind === "trabajo" && role.activityType === activity.type);
  if (!canView) return <Card className="border-red bg-red/5 p-6 text-center"><h2 className="font-bold text-red">No tienes permiso para ver esta actividad</h2><p className="mt-2 text-sm text-ink-muted">La actividad pertenece a otro rol y sus datos permanecen ocultos.</p><Link className="mt-4 inline-block text-sm font-bold text-blue underline" href="/actividades">Volver a mis actividades</Link></Card>;

  const observed = activity.status === "Observada";
  const approved = activity.status === "Aprobada";
  const canManage = role.kind === "trabajo" && role.activityType === activity.type;
  const nextStatus = canManage ? nextActivityStatus(activity.type, activity.status) : null;
  const locationDetails = [activity.placeReference, activity.placeKm && `Km ${activity.placeKm}`, activity.placeDirection].filter(Boolean).join(" · ");
  const openObservation = activity.observations.find((observation) => !observation.resolvedAt);
  const materialUrl = safeMaterialUrl(activity.materialLink);

  function submitResponse() {
    const result = respondToObservation(window.localStorage, id, response, role.label);
    setMessage(result.ok ? "Respuesta enviada a Supervisión." : result.error);
    if (result.ok) setResponse("");
  }

  function saveEditedMessage() {
    if (!editingMessage) return;
    const result = editObservationText(window.localStorage, id, editingMessage.id, editingMessage.field, editText, role.label);
    setMessage(result.ok ? "Mensaje actualizado; la edición quedó registrada." : result.error);
    if (result.ok) { setEditingMessage(null); setEditText(""); }
  }

  function removeMessage() {
    if (!deletingMessage) return;
    const result = deleteObservationText(window.localStorage, id, deletingMessage.id, deletingMessage.field, role.label);
    setMessage(result.ok ? deletingMessage.field === "message" ? "Observación eliminada; la actividad volvió a su estado anterior." : "Respuesta eliminada; puedes escribir una nueva." : result.error);
    if (result.ok) setDeletingMessage(null);
  }

  return <>
    {observed && <div className="border-l-4 border-observed bg-red/10 p-3 text-sm font-bold text-observed">! Esta actividad espera tu corrección.</div>}
    {approved && <div className="rounded-[5px] bg-ink p-4 text-white"><p className="text-sm font-bold uppercase tracking-[0.14em]">★ Actividad aprobada</p><p className="mt-1 text-xs">Cerrada · sin edición</p></div>}
    <div className="space-y-3 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-5 lg:space-y-0 lg:[&>section:last-of-type]:col-start-2 lg:[&>section:last-of-type]:row-start-1 lg:[&>section:last-of-type]:row-span-4">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue">{activity.type}</p><h2 className="mt-1 text-lg font-bold leading-6">{activity.title}</h2></div><StatusPill status={activity.status} /></div>
        <dl className="mt-4 grid grid-cols-[7.25rem_1fr] gap-x-2 gap-y-2 border-t border-line pt-4 text-sm">
          <dt className="font-bold">Fecha</dt><dd>{formatMoment(activity.dateTime)}</dd>
          <dt className="font-bold">Responsable</dt><dd>{activity.responsible}</dd>
          <dt className="font-bold">Creada por</dt><dd>{activity.createdBy}</dd>
          <dt className="font-bold">Descripción</dt><dd>{activity.description || "Sin descripción"}</dd>
          <dt className="font-bold">Entrega prevista</dt><dd>{formatMoment(activity.deliveryDate)}</dd>
          <dt className="font-bold">Ubicación</dt><dd>{activity.place}<br />{locationDetails && <span className="text-ink-muted">{locationDetails}</span>}</dd>
        </dl>
        {materialUrl && <a className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-[5px] border border-line text-sm font-bold text-blue" href={materialUrl} rel="noreferrer" target="_blank"><SystemIcon className="size-5" name="link" /> Abrir enlace al material</a>}
        {activity.materialLink && !materialUrl && <p className="mt-4 rounded-[5px] border border-red bg-red/5 p-3 text-sm font-bold text-red">El enlace al material no es una dirección segura de OneDrive. Edítalo antes de abrirlo.</p>}
      </Card>
      {activity.observations.some((observation) => !observation.deletedAt) && <section aria-labelledby="observations-title" className="space-y-2"><h2 className="text-xs font-bold uppercase tracking-[0.12em]" id="observations-title">Observaciones internas</h2>{activity.observations.filter((observation) => !observation.deletedAt).map((observation) => <Card className="border-observed bg-red/5 p-3" key={observation.id}><p className="text-xs font-bold uppercase text-observed">{observation.resolvedAt ? "Observación resuelta" : "Corrección solicitada"} · {observation.createdBy}</p>
        {editingMessage?.id === observation.id ? <div className="mt-3 space-y-2"><label className="text-xs font-bold" htmlFor={`edit-${observation.id}`}>Editar {editingMessage.field === "message" ? "observación" : "respuesta"}</label><textarea className="min-h-20 w-full rounded-[5px] border border-line bg-panel p-3 text-sm" id={`edit-${observation.id}`} onChange={(event) => setEditText(event.target.value)} value={editText} /><div className="grid grid-cols-2 gap-2"><button className="min-h-10 rounded-[5px] border border-line bg-panel text-sm font-bold text-blue" onClick={() => setEditingMessage(null)} type="button">Cancelar</button><button className="min-h-10 rounded-[5px] bg-blue text-sm font-bold text-white" onClick={saveEditedMessage} type="button">Guardar edición</button></div></div> : <><p className="mt-2 text-sm">{observation.message} {observation.messageEditedAt && <span className="text-xs font-bold text-ink-muted">(Editado)</span>}</p>{role.supervises && !observation.resolvedAt && <span className="mt-1 inline-flex gap-3"><button className="text-xs font-bold text-blue underline" onClick={() => { setEditingMessage({ id: observation.id, field: "message" }); setEditText(observation.message); }} type="button">Editar observación</button><button className="text-xs font-bold text-red underline" onClick={() => setDeletingMessage({ id: observation.id, field: "message" })} type="button">Eliminar observación</button></span>}{observation.response && <div className="mt-3 rounded-[5px] border border-line bg-panel p-2 text-sm"><strong>Respuesta:</strong> {observation.response} {observation.responseEditedAt && <span className="text-xs font-bold text-ink-muted">(Editado)</span>}{canManage && !observation.resolvedAt && <span className="ml-2 inline-flex gap-2"><button className="text-xs font-bold text-blue underline" onClick={() => { setEditingMessage({ id: observation.id, field: "response" }); setEditText(observation.response ?? ""); }} type="button">Editar respuesta</button><button className="text-xs font-bold text-red underline" onClick={() => setDeletingMessage({ id: observation.id, field: "response" })} type="button">Eliminar respuesta</button></span>}</div>}</>}
        {!observation.resolvedAt && !observation.response && canManage && <div className="mt-3 space-y-2"><label className="text-xs font-bold" htmlFor={`response-${observation.id}`}>Tu respuesta</label><textarea className="min-h-20 w-full rounded-[5px] border border-line bg-panel p-3 text-sm" id={`response-${observation.id}`} onChange={(event) => setResponse(event.target.value)} value={response} /><button className="min-h-11 w-full rounded-[5px] border border-blue bg-blue px-3 text-sm font-bold text-white" onClick={submitResponse} type="button">Enviar respuesta</button></div>}</Card>)}{deletingMessage && <Card className="border-red bg-red/5 p-3"><p className="text-sm font-bold text-red">¿Confirmas que deseas eliminar este mensaje?</p><p className="mt-1 text-xs text-ink-muted">La acción quedará registrada para auditoría.</p><div className="mt-3 grid grid-cols-2 gap-2"><button className="min-h-10 rounded-[5px] border border-line bg-panel text-sm font-bold text-blue" onClick={() => setDeletingMessage(null)} type="button">Conservar</button><button className="min-h-10 rounded-[5px] bg-red text-sm font-bold text-white" onClick={removeMessage} type="button">Eliminar</button></div></Card>}</section>}
      {message && <p aria-live="polite" className="rounded-[5px] border border-line bg-panel p-3 text-sm font-bold">{message}</p>}
      <section aria-labelledby="history-title"><h2 className="mb-2 text-xs font-bold uppercase tracking-[0.12em]" id="history-title">Historial de estado</h2><Card className="divide-y divide-line">{activity.history.map((entry, index) => <div className="flex items-center justify-between gap-2 p-3 text-xs" key={`${entry.moment}-${index}`}><StatusPill status={entry.status} /><span className="text-right text-ink-muted">{entry.actor}<br />{formatMoment(entry.moment)}</span></div>)}</Card></section>
      <Card className="p-3 text-xs text-ink-muted">Última modificación: <strong className="text-ink">{formatMoment(activity.updatedAt)}</strong></Card>
      {!approved && canManage && <div className="grid grid-cols-2 gap-2"><Link className="flex min-h-11 items-center justify-center rounded-[5px] border border-line bg-panel text-sm font-bold text-blue" href={`/actividades/nueva?editar=${activity.id}`}>Editar</Link><button className="min-h-11 rounded-[5px] border border-amber bg-amber px-3 text-sm font-bold disabled:border-line disabled:bg-panel-secondary disabled:text-ink-muted" disabled={!nextStatus || Boolean(openObservation)} onClick={() => advanceActivity(window.localStorage, activity.id, role.label)} type="button">{openObservation ? "Responde la observación" : nextStatus ? `Avanzar a ${nextStatus}` : "Sin siguiente estado"}</button></div>}
    </div>
  </>;
}
