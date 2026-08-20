"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { StatusPill, internalStatuses } from "@/components/status-pill";
import { activityTypes } from "@/lib/activities";
import { useSimulatedActivities } from "@/lib/activity-simulation";
import { handleAunorFeedback, useAunorFeedback } from "@/lib/aunor-feedback";
import type { Role } from "@/lib/roles";

const control = "min-h-11 rounded-[5px] border border-line bg-panel px-3 text-sm";
export function SupervisionDashboard({ role }: { role: Role }) {
  const activities = useSimulatedActivities().filter((item) => !item.deletedAt); const feedback = useAunorFeedback(); const [type, setType] = useState(""); const [status, setStatus] = useState(""); const [replyId, setReplyId] = useState<string | null>(null); const [reply, setReply] = useState(""); const [notice, setNotice] = useState("");
  const filtered = activities.filter((item) => (!type || item.type === type) && (!status || item.status === status)); const pending = feedback.filter((item) => item.status === "pending" && !item.deletedAt);
  return <div className="space-y-5">{notice && <p aria-live="polite" className="rounded-[5px] border border-blue bg-blue/10 p-3 text-sm font-bold">{notice}</p>}
    <section className="space-y-2"><h2 className="font-bold">Feedback de AUNOR</h2>{pending.length === 0 ? <Card className="p-4 text-sm text-ink-muted">No hay opiniones pendientes.</Card> : pending.map((item) => <Card className="p-3" key={item.id}><p className="text-sm">{item.text}</p>{replyId === item.id ? <div className="mt-3 space-y-2"><textarea className="min-h-20 w-full rounded-[5px] border border-line p-2" onChange={(event) => setReply(event.target.value)} value={reply} /><Button onClick={() => { const result = handleAunorFeedback(window.localStorage, item.id, "responded", role.accountName ?? role.label, reply); setNotice(result.ok ? "Respuesta enviada." : result.error); if (result.ok) setReplyId(null); }}>Enviar</Button></div> : <Button className="mt-3" onClick={() => setReplyId(item.id)} variant="secondary">Responder</Button>}</Card>)}</section>
    <section className="space-y-3"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase text-blue">Control de calidad</p><h2 className="font-bold">Actividades</h2></div><span className="text-xs text-ink-muted">{filtered.length} resultados</span></div><div className="grid grid-cols-2 gap-2"><select className={control} onChange={(event) => setType(event.target.value)} value={type}><option value="">Todos los tipos</option>{activityTypes.map((item) => <option key={item}>{item}</option>)}</select><select className={control} onChange={(event) => setStatus(event.target.value)} value={status}><option value="">Todos los estados</option>{internalStatuses.map((item) => <option key={item}>{item}</option>)}</select></div><div className="grid gap-3 lg:grid-cols-2">{filtered.map((item) => <Card className="p-3" key={item.id}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-blue">{item.type}</p><h3 className="mt-1 font-bold">{item.title}</h3><p className="mt-1 text-xs text-ink-muted">{item.responsible}</p></div><StatusPill status={item.status} /></div><Link className="mt-3 flex min-h-10 items-center justify-center rounded-[5px] border border-line text-sm font-bold text-blue" href={`/actividades/${item.id}`}>Revisar detalle</Link></Card>)}</div></section>
  </div>;
}
