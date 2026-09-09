"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { getAunorWorkspaceAction, performAunorAction } from "@/app/aunor/actions";
import { AgreementList, AunorJourneys, ReplacementSummary } from "@/components/aunor-space";
import { Button } from "@/components/button";
import { emptyAunorWorkspace, type AunorWorkspace, type AunorCommand } from "@/lib/aunor";
import type { SimulatedActivity } from "@/lib/activity-simulation";
import type { Role } from "@/lib/roles";
import type { Json } from "@/lib/supabase/database.types";
import s from "./aunor-space.module.css";

export function AdminAunorPanel({item,role}:{item:SimulatedActivity;role:Role}) {
  const [w,setW]=useState<AunorWorkspace>(emptyAunorWorkspace);
  const [loaded,setLoaded]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [publicationVersion,setPublicationVersion]=useState(0);
  const [summary,setSummary]=useState(""),[service,setService]=useState(""),[reason,setReason]=useState("");
  const [channel,setChannel]=useState("Llamada"),[contact,setContact]=useState(""),[requester,setRequester]=useState(""),[body,setBody]=useState(""),[evidence,setEvidence]=useState("");
  const [original,setOriginal]=useState(item.id),[substitute,setSubstitute]=useState(""),[agreement,setAgreement]=useState(""),[replacementReason,setReplacementReason]=useState(""),[note,setNote]=useState("");
  const [replacementEvidence,setReplacementEvidence]=useState("");
  const [agreementCorrection,setAgreementCorrection]=useState(""),[replacementCorrection,setReplacementCorrection]=useState("");
  const [deliveryLabel,setDeliveryLabel]=useState(item.title);
  const [pending,startTransition]=useTransition();
  const requests=useRef(new Map<string,string>());
  const load=useCallback(async()=>{
    const r=await getAunorWorkspaceAction();
    if(r.ok){setW(r.data);setLoaded(true);return r.data;}
    setError(r.error);return null;
  },[]);
  useEffect(()=>{
    let active=true;
    void getAunorWorkspaceAction().then(result=>{
      if(!active)return;
      if(!result.ok){setError(result.error);return;}
      setW(result.data);setLoaded(true);
      const a=result.data.activities.find(a=>a.id===item.id);
      if(a){setPublicationVersion(a.publication_version);setSummary(a.summary);setService(a.service_id??"");setReason(a.not_performed_reason);}
    });
    return ()=>{active=false;};
  },[item.id]);
  useEffect(()=>{
    let active=true,inFlight=false;
    const poll=async()=>{if(document.visibilityState!=="visible"||inFlight)return;inFlight=true;try{const result=await getAunorWorkspaceAction();if(active&&result.ok)setW(result.data);}catch{if(active)setError("No se pudo actualizar Aunor. Usa Reintentar.");}finally{inFlight=false;}};
    const timer=setInterval(()=>void poll(),30_000);window.addEventListener("focus",poll);
    return ()=>{active=false;clearInterval(timer);window.removeEventListener("focus",poll);};
  },[]);
  const published=w.activities.find(a=>a.id===item.id);
  const mutate=useCallback(async(command:AunorCommand,activityId:string,payload:Record<string,Json>)=>{
    const key=JSON.stringify([command,activityId,payload]),requestId=requests.current.get(key)??crypto.randomUUID();
    requests.current.set(key,requestId);
    return await new Promise<boolean>(resolve=>startTransition(async()=>{
      setError("");
      const result=await performAunorAction({command,activityId,requestId,payload,demoSource:command==="publish"||command==="delivery"?{
        id:item.id,type:item.type,title:item.title,status:item.status,place:item.place,spans:item.spans,
        materialLink:item.materialLink,version:item.version,origin:item.origin,deletedAt:item.deletedAt,
      }:undefined});
      if(!result.ok){setError(result.error);resolve(false);return;}
      requests.current.delete(key);const fresh=await load();if(command==="publish"&&fresh)setPublicationVersion(fresh.activities.find(a=>a.id===item.id)?.publication_version??0);
      if(command!=="read")setNotice("Registro publicado para Aunor. No confirma por el cliente ni aprueba pagos.");
      resolve(true);
    }));
  },[item,load]);
  if(role.id!=="admin"||item.origin==="burson"||item.deletedAt)return null;
  return <section aria-label="Gestión Aunor" className={s.stack}>
    <header className={s.head}><p className="data-label text-cyan-ink">Ficha de actividad · gestión Admin</p><h2 className="section-title text-2xl">Contrato y entregas de Aunor</h2><p className={s.muted}>La planificación y la ejecución no cambian. Publica únicamente información que el cliente pueda ver.</p></header>
    {error&&<div className={s.error} role="alert">{error} <button type="button" onClick={()=>void load()}>Reintentar</button></div>}{notice&&<p className={s.notice} role="status">{notice}</p>}
    {!loaded?<p role="status">Cargando información del canal Aunor…</p>:<>
    <div className={s.detail}>
      <div className={s.card}>
        <div className={s.hero+" technical-surface"}><p className="data-label">Cliente Aunor · publicación explícita</p><p className={s.activityName}>{item.title}</p></div>
        <form className={s.step} onSubmit={async e=>{e.preventDefault();await mutate("publish",item.id,{expectedVersion:publicationVersion,summary,serviceId:service,notPerformedReason:reason});}}>
          <h3>1 · Revisar y publicar la actividad</h3><div className={s.fields}>
          <label className={s.label+" "+s.full}>Resumen para Aunor<textarea className={s.input} rows={3} required maxLength={5000} value={summary} onChange={e=>setSummary(e.target.value)}/><small>No copies opiniones ni notas internas.</small></label>
          <label className={s.label+" "+s.full}>Servicio de referencia<select className={s.input} value={service} onChange={e=>setService(e.target.value)}><option value="">Por relacionar</option>{w.services.map(service=><option key={service.id} value={service.id}>{service.label} · 2.2</option>)}</select><small>Sin referencia contractual, la actividad sigue siendo visible.</small></label>
          <label className={s.label+" "+s.full}>Motivo de trabajo no realizado (si corresponde)<textarea className={s.input} rows={2} maxLength={3000} value={reason} onChange={e=>setReason(e.target.value)} disabled={item.status==="Entregada"}/></label></div>
          <p className={s.footnote}>Se publicarán título, categoría, estado, días y lugares. Las revisiones anteriores se conservan.</p>
          <Button className="mt-4" type="submit" disabled={pending||!summary.trim()}>{published?"Actualizar publicación":"Publicar actividad para Aunor"}</Button>
        </form>
        {published&&<form className={s.step} onSubmit={async e=>{e.preventDefault();await mutate("delivery",item.id,{expectedActivityVersion:item.version,label:deliveryLabel});}}>
          <h3>2 · Publicar una entrega identificada</h3><label className={s.label}>Nombre de la entrega<input className={s.input} value={deliveryLabel} maxLength={180} required onChange={e=>setDeliveryLabel(e.target.value)}/></label>
          <p className={s.footnote}>Se usará el enlace de material actual de la actividad. Cada publicación tendrá su propia versión; no hereda confirmaciones anteriores.</p>
          <Button className="mt-4" type="submit" disabled={pending||item.status!=="Entregada"||!item.materialLink}>Publicar entrega para revisión</Button>
        </form>}
      </div>
      <aside className={s.card+" "+s.confirm+" "+s.pad}><p className="data-label text-cyan-ink">Vista previa · cliente</p><h2 className="section-title">Qué verá Aunor</h2><div className={s.box}><strong>{item.title}</strong><p>{summary||"Escribe el resumen público."}</p><p className={s.footnote}>{item.status} · {item.type}</p>{item.spans.map((j,i)=><p className={s.footnote} key={i}>{j.start}{j.start!==j.end?" – "+j.end:""} · {j.place||item.place||"Lugar por indicar"}</p>)}</div>
        <p className={s.footnote}>{service?w.services.find(s=>s.id===service)?.label:"Por relacionar"}</p><div className={s.stamp+" "+s.sectionGap}><strong>{published?"Publicada para Aunor":"Todavía no publicada"}</strong><p>Las opiniones del operario, conversación interna y auditoría nunca se publican.</p></div>
      </aside>
    </div>
    {published&&<>
      <div className={s.detail}><div className={s.card}>
        <form className={s.step} onSubmit={async e=>{e.preventDefault();const at=Date.parse(contact);if(!Number.isFinite(at)){setError("Indica una fecha de contacto válida.");return;}if(await mutate("agreement",original,{channel,contactedAt:new Date(at).toISOString(),requesterDeclared:requester,body,evidenceLink:evidence,correctsId:agreementCorrection||null})){setBody("");setEvidence("");setAgreementCorrection("");}}}>
          <h3>3 · Registrar lo acordado por llamada</h3><div className={s.fields}>
            <label className={s.label+" "+s.full}>Actividad del acuerdo<select className={s.input} value={original} onChange={e=>{setOriginal(e.target.value);setAgreement("");setAgreementCorrection("");setReplacementCorrection("");}}>{w.activities.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
            <label className={s.label+" "+s.full}>Registro que corrige (opcional)<select className={s.input} value={agreementCorrection} onChange={e=>setAgreementCorrection(e.target.value)}><option value="">Nuevo acuerdo</option>{w.agreements.filter(g=>g.activity_id===original&&g.is_current).map(g=><option key={g.id} value={g.id}>{g.id.slice(-8)} · {g.body.slice(0,80)}</option>)}</select><small>Una corrección crea un registro nuevo; no borra el anterior.</small></label><label className={s.label}>Canal de origen<select className={s.input} value={channel} onChange={e=>setChannel(e.target.value)}><option>Llamada</option><option>Reunión</option><option>Acuerdo verbal</option></select></label>
            <label className={s.label}>Fecha del contacto<input className={s.input} required type="datetime-local" value={contact} onChange={e=>setContact(e.target.value)}/></label>
            <label className={s.label+" "+s.full}>Solicitante declarado<input className={s.input} value={requester} required maxLength={180} minLength={2} onChange={e=>setRequester(e.target.value)}/><small>Texto declarado; no identifica de forma comprobada a una persona.</small></label>
            <label className={s.label+" "+s.full}>Qué se acordó<textarea className={s.input} required rows={3} minLength={2} maxLength={5000} value={body} onChange={e=>setBody(e.target.value)}/></label>
            <label className={s.label+" "+s.full}>Enlace de evidencia (opcional)<input className={s.input} type="url" placeholder="https://" value={evidence} onChange={e=>setEvidence(e.target.value)}/></label>
          </div><p className={s.footnote}>Registrado por Admin · Rhino. El registro administrativo no es una confirmación de Aunor.</p><Button className="mt-4" disabled={pending} type="submit">Publicar acuerdo registrado</Button>
        </form>
        <form className={s.step} onSubmit={async e=>{e.preventDefault();await mutate("replacement",original,{substituteId:substitute,agreementId:agreement,reason:replacementReason,evidenceNote:note,evidenceLink:replacementEvidence,correctsId:replacementCorrection||null});}}>
          <h3>4 · Relacionar original y sustituto</h3><div className={s.fields}><label className={s.label+" "+s.full}>Reemplazo que corrige (opcional)<select className={s.input} value={replacementCorrection} onChange={e=>setReplacementCorrection(e.target.value)}><option value="">Nuevo reemplazo</option>{w.replacements.filter(r=>r.original_activity_id===original&&r.is_current).map(r=><option key={r.id} value={r.id}>{r.id.slice(-8)} · {r.substitute_title}</option>)}</select><small>La nueva relación no hereda confirmaciones anteriores.</small></label>
            <label className={s.label+" "+s.full}>Actividad original<select className={s.input} value={original} onChange={e=>{setOriginal(e.target.value);setAgreement("");}}>{w.activities.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
            <label className={s.label+" "+s.full}>Actividad sustituta<select className={s.input} required value={substitute} onChange={e=>setSubstitute(e.target.value)}><option value="">Seleccionar actividad publicada</option>{w.activities.filter(a=>a.id!==original).map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
            <label className={s.label+" "+s.full}>Acuerdo registrado<select className={s.input} required value={agreement} onChange={e=>setAgreement(e.target.value)}><option value="">Seleccionar acuerdo</option>{w.agreements.filter(g=>g.activity_id===original||g.activity_id===substitute).map(g=><option key={g.id} value={g.id}>{g.channel} · {g.body.slice(0,90)}</option>)}</select></label>
            <label className={s.label+" "+s.full}>Motivo de la relación<textarea className={s.input} required rows={2} minLength={2} maxLength={3000} value={replacementReason} onChange={e=>setReplacementReason(e.target.value)}/></label>
            <label className={s.label+" "+s.full}>Enlace de evidencia del reemplazo (opcional)<input className={s.input} type="url" value={replacementEvidence} onChange={e=>setReplacementEvidence(e.target.value)}/></label><label className={s.label+" "+s.full}>Evidencia del acuerdo<textarea className={s.input} required rows={2} minLength={2} maxLength={3000} value={note} onChange={e=>setNote(e.target.value)}/><small>Puede ser una nota de la llamada registrada; no inventes una aprobación escrita.</small></label>
          </div><p className={s.footnote}>Se conservan las dos actividades. La confirmación de Aunor quedará pendiente; no se calcula una equivalencia ni se modifican entregas.</p><Button className="mt-4" type="submit" disabled={pending||!substitute||!agreement}>Publicar reemplazo para Aunor</Button>
        </form>
      </div><aside className={s.card+" "+s.pad}><h2 className="section-title">Revisar antes de publicar</h2><div className={s.box}><strong>Original conservado</strong>{w.activities.find(a=>a.id===original)?.title}</div><p className="py-3 text-center text-cyan-ink">↓</p><div className={s.box}><strong>Sustituto identificado</strong>{w.activities.find(a=>a.id===substitute)?.title??"Selecciona el sustituto"}</div>{substitute&&<AunorJourneys w={w} id={substitute}/>}<div className={s.stamp+" "+s.sectionGap}><strong>Pendiente de confirmación por Aunor</strong>Admin registra; no confirma en nombre del cliente.</div></aside></div>
      <AgreementList w={w} id={item.id}/>
      {w.replacements.filter(r=>r.original_activity_id===item.id||r.substitute_activity_id===item.id).map(r=><section className={s.card+" "+s.pad} key={r.id}><p className="data-label text-cyan-ink">Reemplazo {r.id.slice(-8)}</p><ReplacementSummary r={r} w={w} admin/></section>)}
    </>}
    </>}
  </section>;
}
