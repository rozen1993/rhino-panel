"use client";
import { useState, useTransition } from "react";
import { classifySupabaseActivityAction, regularizeSupabaseActivityAction, type ActivityServerResult } from "@/app/actividades/actions";
import { actorFromRole, classifyActivity, regularizeHistoricalActivity, type SimulatedActivity } from "@/lib/activity-simulation";
import type { ActivityClassification } from "@/lib/activity-classification";
import { ClassificationPicker } from "./classification-picker";
import { calendarDateInLima } from "@/lib/historical";
import { lastDate } from "@/lib/activities";
import { safeMaterialUrl } from "@/lib/external-link";
import type { DataSource } from "@/lib/data-source";
import type { Role } from "@/lib/roles";
import { Button } from "./button";
import { Card } from "./card";

export function ActivityHistoryControls({item, role, dataSource, onResult}:{item:SimulatedActivity;role:Role;dataSource:DataSource;onResult:(r:ActivityServerResult,notice:string)=>void}) {
  const [confirmed,setConfirmed]=useState(false), [pending,start]=useTransition();
  const [classification,setClassification]=useState<ActivityClassification|null>(item.classification ?? "standard");
  if(role.id!=="admin" || role.mustChangePassword || item.deletedAt) return null;
  const historical=(item.deliveryDueOn || lastDate(item))<calendarDateInLima();
  return <Card className="space-y-4 p-4">
    <div><p className="data-label text-cyan-ink">Control de archivo · Admin</p><h3 className="display-title mt-1 text-xl">Clasificación del trabajo</h3></div>
    <ClassificationPicker value={classification} onChange={setClassification}/>
    <p className="text-xs text-ink-muted">No altera el estado ni multiplica las unidades del contrato.</p>
    <Button variant="secondary" disabled={pending || classification===(item.classification ?? "standard")} onClick={()=>start(async()=>{
      const result=dataSource==="supabase" ? await classifySupabaseActivityAction(item.id,item.version,classification) : classifyActivity(window.localStorage,item.id,actorFromRole(role),item.version,classification);
      onResult(result,"Clasificación actualizada.");
    })}>Guardar marcaje</Button>
    {historical && item.status!=="Entregada" && item.origin==="operario" && <details className="border-t border-line pt-3">
      <summary className="min-h-11 cursor-pointer text-sm font-bold text-cyan-ink">Regularizar entrega histórica</summary>
      <p className="mt-2 text-xs leading-5 text-ink-muted">Solo para trabajos antiguos ya terminados. Se conserva esta actividad, sus fechas, material e historial. La fecha real de entrega quedará como desconocida; se registrará cuándo realizaste esta regularización.</p>
      {!safeMaterialUrl(item.materialLink) && <p className="mt-2 text-xs font-bold">Falta el enlace del material final. El responsable debe registrarlo primero.</p>}
      <label className="my-3 flex items-start gap-2 text-xs leading-5"><input type="checkbox" className="mt-1" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Confirmo que este trabajo ya fue entregado y que el material enlazado es el final.</label>
      <Button disabled={pending || !confirmed || !safeMaterialUrl(item.materialLink)} onClick={()=>start(async()=>{
        const result=dataSource==="supabase" ? await regularizeSupabaseActivityAction(item.id,item.version,confirmed) : regularizeHistoricalActivity(window.localStorage,item.id,actorFromRole(role),item.version,confirmed);
        onResult(result,"Entrega histórica regularizada, sin inventar la fecha real de entrega.");
        if(result.ok) setConfirmed(false);
      })}>{pending ? "Guardando…" : "Confirmar entrega histórica"}</Button>
    </details>}
  </Card>;
}
