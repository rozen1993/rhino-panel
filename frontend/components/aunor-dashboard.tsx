"use client";

import { useState } from "react";
import { AunorStatusPill, aunorStatuses } from "@/components/aunor-status-pill";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { MonthStrip } from "@/components/month-strip";
import { deleteAunorFeedback, editAunorFeedback, useAunorFeedback, submitAunorFeedback } from "@/lib/aunor-feedback";
import { projectActivityForAunor } from "@/lib/aunor";
import { useSimulatedActivities } from "@/lib/activity-simulation";

function formatMoment(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(date); }

export function AunorDashboard() {
  const source = useSimulatedActivities();
  const feedback = useAunorFeedback();
  const activities = source.map(projectActivityForAunor).filter((item) => item !== null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const totals = Object.fromEntries(aunorStatuses.map((status) => [status, activities.filter((activity) => activity.status === status).length]));
  const counts = Array.from({ length: 12 }, (_, month) => source.filter((activity) => activity.status !== "Cancelada" && new Date(activity.dateTime).getMonth() === month).length);

  function submit(activityId: string) {
    const result = submitAunorFeedback(window.localStorage, activityId, drafts[activityId] ?? "");
    setNotice((current) => ({ ...current, [activityId]: result.ok ? "Tu opinión fue enviada a Supervisión." : result.error }));
    if (result.ok) setDrafts((current) => ({ ...current, [activityId]: "" }));
  }

  function saveEdit(activityId: string) {
    if (!editingId) return;
    const result = editAunorFeedback(window.localStorage, editingId, "text", editText, "AUNOR");
    setNotice((current) => ({ ...current, [activityId]: result.ok ? "Opinión actualizada." : result.error }));
    if (result.ok) { setEditingId(null); setEditText(""); }
  }

  function removeFeedback(activityId: string) {
    if (!deletingId) return;
    const result = deleteAunorFeedback(window.localStorage, deletingId, "text", "AUNOR");
    setNotice((current) => ({ ...current, [activityId]: result.ok ? "Opinión eliminada." : result.error }));
    if (result.ok) setDeletingId(null);
  }

  return <>
    <MonthStrip activeMonth="AGO" counts={counts} />
    <section aria-labelledby="groups-title" className="space-y-2"><h2 className="text-sm font-bold uppercase tracking-[0.1em]" id="groups-title">Estado del mes</h2><div className="grid grid-cols-2 gap-2 lg:grid-cols-5 lg:gap-4">{aunorStatuses.map((status) => <Card className="flex min-h-20 flex-col items-start justify-between p-3" key={status}><AunorStatusPill status={status} /><span className="mt-2 text-2xl font-bold tabular-nums">{totals[status]}</span></Card>)}</div></section>
    <section aria-labelledby="aunor-activities-title" className="space-y-2"><div className="flex items-end justify-between gap-3"><h2 className="text-sm font-bold uppercase tracking-[0.1em]" id="aunor-activities-title">Actividades</h2><span className="text-xs text-ink-muted">{activities.length} visibles</span></div><div className="grid gap-3 lg:grid-cols-2">{activities.map((activity) => {
      const comments = feedback.filter((item) => item.activityId === activity.id && !item.deletedAt);
      return <Card className="p-3" key={activity.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-blue">{activity.date} · {activity.type}</p><h3 className="mt-1 text-sm font-bold leading-5">{activity.title}</h3><p className="mt-1 text-xs text-ink-muted">{activity.place}</p></div><AunorStatusPill status={activity.status} /></div>
        {comments.length > 0 && <div className="mt-3 space-y-2 border-t border-line pt-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-blue">Tus opiniones</p>{comments.map((comment) => <div className="border-l-[3px] border-blue bg-blue/5 px-3 py-2 text-sm leading-5" key={comment.id}><span className="mb-1 block text-[0.6875rem] font-bold text-blue">{formatMoment(comment.createdAt)} {comment.textEditedAt && "· Editado"}</span>{editingId === comment.id ? <div className="space-y-2"><textarea aria-label="Editar opinión" className="min-h-20 w-full rounded-[5px] border border-line bg-panel p-2" onChange={(event) => setEditText(event.target.value)} value={editText} /><div className="grid grid-cols-2 gap-2"><Button onClick={() => setEditingId(null)} variant="secondary">Cancelar</Button><Button onClick={() => saveEdit(activity.id)}>Guardar</Button></div></div> : deletingId === comment.id ? <div className="space-y-2"><p className="font-bold text-red">¿Eliminar esta opinión?</p><div className="grid grid-cols-2 gap-2"><Button onClick={() => setDeletingId(null)} variant="secondary">Conservar</Button><Button onClick={() => removeFeedback(activity.id)}>Eliminar</Button></div></div> : <>{comment.text}{comment.status === "pending" && <span className="ml-2 inline-flex gap-2"><button className="text-xs font-bold text-blue underline" onClick={() => { setEditingId(comment.id); setEditText(comment.text); }} type="button">Editar</button><button className="text-xs font-bold text-red underline" onClick={() => setDeletingId(comment.id)} type="button">Eliminar</button></span>}</>}{comment.response && <span className="mt-2 block rounded-[5px] border border-line bg-panel p-2"><strong>Respuesta de Rhino:</strong> {comment.response} {comment.responseEditedAt && <small className="font-bold text-ink-muted">(Editado)</small>}</span>}</div>)}</div>}
        <div className="mt-3 border-t border-line pt-3"><label className="text-sm font-bold" htmlFor={`comment-${activity.id}`}>Dejar una opinión</label><textarea className="mt-2 min-h-20 w-full resize-y rounded-[5px] border border-line bg-panel px-3 py-2 text-sm placeholder:text-ink-muted" id={`comment-${activity.id}`} onChange={(event) => setDrafts((current) => ({ ...current, [activity.id]: event.target.value }))} placeholder="Escribe un comentario sobre esta actividad" value={drafts[activity.id] ?? ""} />{notice[activity.id] && <p aria-live="polite" className="mt-2 text-xs font-bold text-blue">{notice[activity.id]}</p>}<Button className="mt-2 w-full" onClick={() => submit(activity.id)} type="button">Enviar opinión</Button></div>
      </Card>;
    })}</div></section>
  </>;
}
