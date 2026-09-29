"use client";
import { useState, useTransition } from "react";
import { configureContractPeriodAction, assignContractPeriodAction } from "@/app/aunor/contract-actions";
import type { AunorWorkspace } from "@/lib/aunor";
import { periodLabel } from "@/lib/contract-progress";
import { annualReportingCycle, contractReferences, contractStartMonth, referenceLabel, referenceMonthlyPeriod } from "@/lib/contract-reference";
import { Button } from "./button";
import type { SimulatedActivity } from "@/lib/activity-simulation";
import s from "./aunor-space.module.css";

export function AdminContractPeriod({w,activityId,activityVersion,onRefresh,onAssigned}:{w:AunorWorkspace;activityId:string;activityVersion:number;onRefresh:()=>Promise<unknown>;onAssigned:(activity:SimulatedActivity|null)=>void}) {
  const activity=w.activities.find(a=>a.id===activityId), service=activity?.service_id;
  const periods=(w.contractPeriods ?? []).filter(p=>p.service_id===service).sort((a,b)=>a.starts_on.localeCompare(b.starts_on));
  const [selected,setSelected]=useState(activity?.contract_period_id ?? ""),[confirmed,setConfirmed]=useState(false);
  const [cadence,setCadence]=useState<"monthly"|"annual">("monthly"),[start,setStart]=useState(""),[end,setEnd]=useState(""),[target,setTarget]=useState("");
  const [editId,setEditId]=useState(""),[notice,setNotice]=useState(""),[pending,transition]=useTransition();
  const [referenceMonth,setReferenceMonth]=useState(contractStartMonth);
  if(!service || !activity?.publication_version) return <p className={s.footnote}>Publica primero la referencia contractual. Después podrás confirmar a qué periodo corresponde el trabajo.</p>;
  const edit=periods.find(p=>p.id===editId);
  const reference=contractReferences[service];
  return <section className={s.step} aria-label="Periodo contractual">
    <h3>Periodo de cumplimiento</h3><p className={s.footnote}>La fecha de la actividad no asigna el mes automáticamente. Confirma el periodo acordado; solo contará al estar Entregada.</p>
    {notice && <p role="status" className={s.notice}>{notice}</p>}
    <label className={s.label}>Periodo de esta actividad<select className={s.input} value={selected} onChange={e=>{setSelected(e.target.value);setConfirmed(false);}}><option value="">Por confirmar</option>{periods.map(p=><option key={p.id} value={p.id}>{periodLabel(p)} · {p.target===null ? "Meta por confirmar" : `${p.target} trabajos`}</option>)}</select></label>
    <label className="my-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Confirmo que este es el periodo contractual correcto.</label>
    <Button disabled={pending || !confirmed} onClick={()=>transition(async()=>{
      const result=await assignContractPeriodAction(activityId,activityVersion,activity.publication_version,selected || null,confirmed);
      setNotice(result.ok?"Periodo confirmado. Solo las actividades entregadas suman al total.":result.error);
      if(result.ok){setConfirmed(false);await onRefresh();onAssigned(result.activity);}
    })}>Confirmar periodo</Button>
    <details className="mt-4 border-t border-line pt-3"><summary className="min-h-11 cursor-pointer text-sm font-bold text-cyan-ink">Configurar periodos y metas del servicio</summary>
      <p className={s.footnote}>Usa las fechas del periodo de seguimiento y las cuotas confirmadas. El ciclo anual no equivale a la fecha de vencimiento del contrato. Para un mes parcial, revisa expresamente sus fechas y cuota. No se traslada el excedente.</p>
      {reference && <div className={s.notice}>
        <strong>Referencia confirmada · {referenceLabel(service)}</strong>
        <p className={s.footnote}>{reference.source} Inicio operativo: abril de 2026.</p>
        {!edit && <>
          {reference.cadence==="monthly" ? <label className={s.label}>Mes a preparar<input className={s.input} type="month" min={contractStartMonth} value={referenceMonth} onChange={e=>setReferenceMonth(e.target.value)}/></label>
            : <p className={s.footnote}>Ciclo operativo anual: abril de 2026 a marzo de 2027. Es una ventana de seguimiento, no la fecha de vencimiento del contrato.</p>}
          <Button className="mt-3" variant="secondary" onClick={()=>{
            const prepared=reference.cadence==='annual' ? {...annualReportingCycle,service_id:service,cadence:reference.cadence,target:reference.target} : referenceMonthlyPeriod(service,referenceMonth);
            if(reference.cadence==="monthly" && !prepared){setNotice("Elige un mes válido desde abril de 2026.");return;}
            const existing=prepared && periods.find(p=>p.starts_on===prepared.starts_on && p.ends_on===prepared.ends_on);
            if(existing){setEditId(existing.id);setStart(existing.starts_on);setEnd(existing.ends_on);setCadence(existing.cadence);setTarget(existing.target?.toString() ?? "");setNotice("Ese periodo ya existe. Se conserva su meta actual; puedes revisarla sin duplicarlo.");return;}
            setCadence(reference.cadence);setTarget(reference.target?.toString() ?? "");setStart(prepared?.starts_on ?? "");setEnd(prepared?.ends_on ?? "");
            setNotice("Referencia preparada. Revisa los datos y guarda para registrar el periodo; no se asignaron actividades.");
          }}>Usar referencia confirmada</Button>
        </>}
      </div>}
      <form className={s.fields} onSubmit={e=>{e.preventDefault();transition(async()=>{
        const result=await configureContractPeriodAction({id:edit?.id,version:edit?.version,service_id:service,cadence,starts_on:start,ends_on:end,target:target===""?null:Number(target)});
        setNotice(result.ok?"Periodo guardado; ahora puedes asignarle actividades.":result.error);
        if(result.ok) await onRefresh();
      });}}>
        <label className={s.label+" "+s.full}>Configuración<select className={s.input} value={editId} onChange={e=>{
          setEditId(e.target.value);const p=periods.find(p=>p.id===e.target.value);setStart(p?.starts_on ?? "");setEnd(p?.ends_on ?? "");setCadence(p?.cadence ?? "monthly");setTarget(p?.target?.toString() ?? "");
        }}><option value="">Nuevo periodo</option>{periods.map(p=><option key={p.id} value={p.id}>Actualizar meta: {periodLabel(p)}</option>)}</select></label>
        <label className={s.label}>Periodicidad<select className={s.input} disabled={Boolean(edit)} value={cadence} onChange={e=>setCadence(e.target.value as "monthly"|"annual")}><option value="monthly">Mensual</option><option value="annual">Anual según vigencia</option></select></label>
        <label className={s.label}>Meta (opcional)<input className={s.input} type="number" min="1" max="1000000" step="1" placeholder="Por confirmar" value={target} onChange={e=>setTarget(e.target.value)}/></label>
        <label className={s.label}>Inicio<input className={s.input} type="date" min="2026-01-01" required disabled={Boolean(edit)} value={start} onChange={e=>setStart(e.target.value)}/></label>
        <label className={s.label}>Fin<input className={s.input} type="date" min={start || "2026-01-01"} required disabled={Boolean(edit)} value={end} onChange={e=>setEnd(e.target.value)}/></label>
        <Button type="submit" disabled={pending} variant="secondary">Guardar periodo contractual</Button>
      </form>
    </details>
  </section>;
}
