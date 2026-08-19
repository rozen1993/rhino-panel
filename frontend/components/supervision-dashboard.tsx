"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { StatusPill, internalStatuses } from "@/components/status-pill";
import { activityTypes } from "@/lib/activities";
import { approveActivity, cancelActivity, observeActivity, resolveObservation, useSimulatedActivities } from "@/lib/activity-simulation";
import { deleteAunorFeedback, editAunorFeedback, handleAunorFeedback, useAunorFeedback } from "@/lib/aunor-feedback";
import type { Role } from "@/lib/roles";
import { getSupervisionActions } from "@/lib/supervision";

const filterClass = "min-h-11 w-full rounded-[5px] border border-line bg-panel px-3 text-sm text-ink";

export function SupervisionDashboard({ role }: { role: Role }) {
  const activities = useSimulatedActivities();
  const aunorFeedback = useAunorFeedback();
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [observingId, setObservingId] = useState<string | null>(null);
  const [observation, setObservation] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [editingRhinoReplyId, setEditingRhinoReplyId] = useState<string | null>(null);
  const [editedRhinoReply, setEditedRhinoReply] = useState("");
  const [deletingRhinoReplyId, setDeletingRhinoReplyId] = useState<string | null>(null);
  const answered = activities.filter((activity) => activity.status === "Observada" && activity.observations.some((item) => !item.resolvedAt && item.response));
  const filtered = activities.filter((activity) => (!typeFilter || activity.type === typeFilter) && (!statusFilter || activity.status === statusFilter));
  const pendingFeedback = aunorFeedback.filter((item) => item.status === "pending" && !item.deletedAt);
  const answeredFeedback = aunorFeedback.filter((item) => item.status === "responded");

  function report(result: ReturnType<typeof approveActivity>, success: string) {
    setNotice(result.ok ? success : result.error);
  }

  function submitObservation(id: string) {
    const result = observeActivity(window.localStorage, id, observation, role.label);
    report(result, "Observación enviada al colaborador.");
    if (result.ok) { setObservingId(null); setObservation(""); }
  }

  function answerFeedback(id: string) {
    const result = handleAunorFeedback(window.localStorage, id, "responded", role.label, reply);
    setNotice(result.ok ? "Respuesta enviada a AUNOR." : result.error);
    if (result.ok) { setReplyingId(null); setReply(""); }
  }

  function convertFeedback(id: string, activityId: string, text: string) {
    const observed = observeActivity(window.localStorage, activityId, text, role.label);
    if (!observed.ok) { setNotice(observed.error); return; }
    const handled = handleAunorFeedback(window.localStorage, id, "converted", role.label);
    setNotice(handled.ok ? "Feedback convertido en observación interna." : handled.error);
  }

  function saveRhinoReply() {
    if (!editingRhinoReplyId) return;
    const result = editAunorFeedback(window.localStorage, editingRhinoReplyId, "response", editedRhinoReply, role.label);
    setNotice(result.ok ? "Respuesta de Rhino actualizada." : result.error);
    if (result.ok) { setEditingRhinoReplyId(null); setEditedRhinoReply(""); }
  }

  return <>
    {notice && <p aria-live="polite" className="rounded-[5px] border border-blue bg-blue/10 p-3 text-sm font-bold">{notice}</p>}
    <section aria-labelledby="answered-title" className="space-y-2">
      <div className="flex items-end justify-between gap-3"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-red">Observación interna</p><h2 className="mt-1 text-base font-bold" id="answered-title">Respondidas por cerrar</h2></div><span className="text-xs font-bold tabular-nums text-red">{answered.length} pendientes</span></div>
      {answered.length === 0 ? <Card className="p-4 text-sm text-ink-muted">No hay respuestas pendientes de revisión.</Card> : answered.map((activity) => {
        const item = activity.observations.find((entry) => !entry.resolvedAt && entry.response)!;
        return <Card className="border-red bg-red/5 p-3" key={activity.id}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-red">Observación · {item.createdBy}</p><h3 className="mt-1 text-sm font-bold leading-5">{activity.title}</h3></div><StatusPill status="Observada" /></div><div className="mt-3 space-y-2 border-t border-red/30 pt-3 text-sm"><p><strong>Observación:</strong> {item.message}</p><p className="rounded-[5px] border border-line bg-panel p-2"><strong>Respuesta de {item.respondedBy}:</strong> {item.response}</p></div><div className="mt-3 grid grid-cols-2 gap-2"><Link className="flex min-h-11 items-center justify-center rounded-[5px] border border-line bg-panel text-sm font-bold text-blue" href={`/actividades/${activity.id}`}>Ver detalle</Link><Button onClick={() => report(resolveObservation(window.localStorage, activity.id, role.label), `Observación resuelta; volvió a ${activity.preObservationStatus}.`)}>Resolver</Button></div></Card>;
      })}
    </section>

    <section aria-labelledby="client-feedback-title" className="space-y-2">
      <div className="flex items-end justify-between gap-3"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-blue">AUNOR · opinión del cliente</p><h2 className="mt-1 text-base font-bold" id="client-feedback-title">Feedback por atender</h2></div><span className="text-xs font-bold tabular-nums text-blue">{pendingFeedback.length} pendientes</span></div>
      <aside className="rounded-[5px] border border-blue bg-blue/10 p-3 text-xs font-semibold leading-5">El feedback de AUNOR no cambia el estado de las actividades y no llega directo al colaborador.</aside>
      {pendingFeedback.length === 0 ? <Card className="p-4 text-sm text-ink-muted">No hay opiniones pendientes de atención.</Card> : pendingFeedback.map((feedback) => {
        const activity = activities.find((item) => item.id === feedback.activityId);
        return <Card className="border-blue p-3" key={feedback.id}><p className="text-xs font-bold text-blue">AUNOR · opinión del cliente</p><h3 className="mt-1 text-sm font-bold">{activity?.title ?? "Actividad no disponible"}</h3><blockquote className="mt-3 border-l-[3px] border-blue bg-blue/5 px-3 py-2 text-sm">{feedback.text}</blockquote>
          {replyingId === feedback.id ? <div className="mt-3 space-y-2"><label className="text-xs font-bold" htmlFor={`feedback-reply-${feedback.id}`}>Respuesta para AUNOR</label><textarea className="min-h-20 w-full rounded-[5px] border border-line bg-panel p-3 text-sm" id={`feedback-reply-${feedback.id}`} onChange={(event) => setReply(event.target.value)} value={reply} /><div className="grid grid-cols-2 gap-2"><Button onClick={() => { setReplyingId(null); setReply(""); }} variant="secondary">Volver</Button><Button onClick={() => answerFeedback(feedback.id)}>Enviar</Button></div></div> : <div className="mt-3 grid gap-2"><Button onClick={() => setReplyingId(feedback.id)} variant="secondary">Responder</Button><Button disabled={!activity || !["En proceso", "Por subir", "Entregada"].includes(activity.status)} onClick={() => activity && convertFeedback(feedback.id, activity.id, feedback.text)} variant="secondary">Convertir en observación interna</Button><button className="min-h-10 text-xs font-bold text-ink-muted underline underline-offset-4" onClick={() => { const result = handleAunorFeedback(window.localStorage, feedback.id, "discarded", role.label); setNotice(result.ok ? "Feedback descartado." : result.error); }} type="button">Descartar</button></div>}
        </Card>;
      })}
      {answeredFeedback.length > 0 && <details className="rounded-[5px] border border-line bg-panel p-3"><summary className="cursor-pointer text-sm font-bold">Respuestas enviadas ({answeredFeedback.length})</summary><div className="mt-3 space-y-2">{answeredFeedback.map((feedback) => <div className="rounded-[5px] border border-line bg-panel-secondary p-3 text-sm" key={feedback.id}><p className="font-semibold">{feedback.text}</p>{editingRhinoReplyId === feedback.id ? <div className="mt-2 space-y-2"><textarea aria-label="Editar respuesta de Rhino" className="min-h-20 w-full rounded-[5px] border border-line bg-panel p-2" onChange={(event) => setEditedRhinoReply(event.target.value)} value={editedRhinoReply} /><div className="grid grid-cols-2 gap-2"><Button onClick={() => setEditingRhinoReplyId(null)} variant="secondary">Cancelar</Button><Button onClick={saveRhinoReply}>Guardar</Button></div></div> : deletingRhinoReplyId === feedback.id ? <div className="mt-2 rounded-[5px] border border-red bg-red/5 p-2"><p className="font-bold text-red">¿Eliminar esta respuesta?</p><div className="mt-2 grid grid-cols-2 gap-2"><Button onClick={() => setDeletingRhinoReplyId(null)} variant="secondary">Conservar</Button><Button onClick={() => { const result = deleteAunorFeedback(window.localStorage, feedback.id, "response", role.label); setNotice(result.ok ? "Respuesta eliminada; el feedback volvió a pendientes." : result.error); setDeletingRhinoReplyId(null); }}>Eliminar</Button></div></div> : <p className="mt-2 rounded-[5px] bg-panel p-2"><strong>Respuesta de Rhino:</strong> {feedback.response} {feedback.responseEditedAt && <span className="text-xs text-ink-muted">(Editado)</span>}<span className="ml-2 inline-flex gap-2"><button className="text-xs font-bold text-blue underline" onClick={() => { setEditingRhinoReplyId(feedback.id); setEditedRhinoReply(feedback.response ?? ""); }} type="button">Editar</button><button className="text-xs font-bold text-red underline" onClick={() => setDeletingRhinoReplyId(feedback.id)} type="button">Eliminar</button></span></p>}</div>)}</div></details>}
    </section>

    <section aria-labelledby="team-title" className="space-y-3">
      <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-blue">Vista completa</p><h2 className="mt-1 text-base font-bold" id="team-title">Actividades del equipo</h2></div>
      <div aria-label="Filtros" className="grid gap-2 lg:grid-cols-2"><label><span className="sr-only">Filtrar por tipo</span><select className={filterClass} onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}><option value="">Todos los tipos</option>{activityTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label><span className="sr-only">Filtrar por estado</span><select className={filterClass} onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="">Todos los estados</option>{internalStatuses.map((status) => <option key={status}>{status}</option>)}</select></label></div>
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">{filtered.map((activity) => {
        const actions = getSupervisionActions(activity.status);
        return <Card className={`relative overflow-hidden p-3 ${activity.status === "Observada" ? "border-observed bg-red/5 pl-4" : ""}`} key={activity.id}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-blue">{activity.date} · {activity.type}</p><h3 className="mt-1 text-sm font-bold leading-5">{activity.title}</h3><p className="mt-1 text-xs text-ink-muted">Responsable: <strong className="text-ink">{activity.responsible}</strong></p></div><StatusPill status={activity.status} /></div>
          {observingId === activity.id && <div className="mt-3 space-y-2 border-t border-line pt-3"><label className="text-xs font-bold" htmlFor={`observation-${activity.id}`}>Motivo de la observación</label><textarea className="min-h-24 w-full rounded-[5px] border border-line bg-panel p-3 text-sm" id={`observation-${activity.id}`} onChange={(event) => setObservation(event.target.value)} value={observation} /><div className="grid grid-cols-2 gap-2"><Button onClick={() => { setObservingId(null); setObservation(""); }} variant="secondary">Volver</Button><Button onClick={() => submitObservation(activity.id)}>Enviar</Button></div></div>}
          {cancelId === activity.id && <div className="mt-3 rounded-[5px] border border-red bg-red/5 p-3"><p className="text-sm font-bold">¿Confirmas que esta actividad no se realizará?</p><div className="mt-2 grid grid-cols-2 gap-2"><Button onClick={() => setCancelId(null)} variant="secondary">No cancelar</Button><Button onClick={() => { report(cancelActivity(window.localStorage, activity.id, role.label), "Actividad cancelada."); setCancelId(null); }}>Confirmar</Button></div></div>}
          {actions.length > 0 && observingId !== activity.id && cancelId !== activity.id && <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3"><Link className="flex min-h-9 items-center justify-center rounded-[5px] border border-line bg-panel px-3 text-xs font-bold text-blue" href={`/actividades/${activity.id}`}>Ver</Link>{actions.map((action) => <Button className="min-h-9 flex-1 px-3 py-1 text-xs" key={action} onClick={() => action === "Observar" ? setObservingId(activity.id) : action === "Aprobar" ? report(approveActivity(window.localStorage, activity.id, role.label), "Actividad aprobada.") : setCancelId(activity.id)} variant={action === "Aprobar" ? "primary" : "secondary"}>{action}</Button>)}</div>}
        </Card>;
      })}</div>
    </section>
  </>;
}
