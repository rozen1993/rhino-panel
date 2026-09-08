"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/button";
import { StatusPill } from "@/components/status-pill";
import { SystemIcon } from "@/components/system-icon";
import { AnnualCalendarView, type CalendarDetailProps } from "@/components/annual-calendar-view";
import { getAunorWorkspaceAction, performAunorAction } from "@/app/aunor/actions";
import { aunorCode, aunorDisclaimer, type AunorActivityRow, type AunorWorkspace, type AunorCommand, type AunorReplacement } from "@/lib/aunor";
import type { Role } from "@/lib/roles";
import type { Json } from "@/lib/supabase/database.types";
import { safeMaterialUrl } from "@/lib/external-link";
import s from "./aunor-space.module.css";

export type AunorScene="panel"|"detail"|"acordado"|"messages"|"calendar"|"replacement";
type Mutation=(command:AunorCommand,activityId:string,payload:Record<string,Json>)=>Promise<boolean>;
const date=(value:string)=>new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",day:"numeric",month:"short",year:"numeric"}).format(new Date(value.length===10?value+"T12:00:00Z":value));
const moment=(value:string)=>new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(value));
export const activityHref=(id:string)=>"/aunor/actividades/"+encodeURIComponent(id);
const replacementHref=(id:string)=>"/aunor/reemplazos/"+encodeURIComponent(id);
const serviceName=(w:AunorWorkspace,id:string|null)=>w.services.find(s=>s.id===id)?.label;
export function AunorJourneys({w,id}:{w:AunorWorkspace;id:string}) {
  const a=w.activities.find(a=>a.id===id);
  const journeys=w.journeys.filter(j=>j.activity_id===id);
  return <div>{journeys.length?journeys.map(j=><div className={s.journey} key={j.position}><SystemIcon name="calendar" className="size-4"/><strong>{date(j.start_date)}{j.start_date!==j.end_date?" – "+date(j.end_date):""}</strong><span>{j.place||a?.place||"Lugar por indicar"}</span></div>):<p className={s.muted}>Sin jornadas publicadas.</p>}</div>;
}
function ServiceTag({w,a}:{w:AunorWorkspace;a:AunorActivityRow}) {
  return a.service_id?<span>{serviceName(w,a.service_id)} · 2.2</span>:<span className={s.unlinked}>Por relacionar</span>;
}
function Unread({count}:{count:number}) { return count?<span className={s.badge}>● {count} {count===1?"nuevo":"nuevos"}</span>:<span className={s.muted}>Sin mensajes nuevos</span>; }
export function AunorActivityCard({a,w}:{a:AunorActivityRow;w:AunorWorkspace}) {
  const delivery=w.deliveries.find(d=>d.activity_id===a.id&&d.is_current);
  return <article className={s.card}>
    <div className={s.top+" "+(a.type==="Edición"?s.edit:"")}><div className={s.row}><p className="data-label text-cyan-ink">{a.type} · {aunorCode(a.id,a.type)}</p><StatusPill status={a.status}/></div><h2 className="section-title">{a.title}</h2></div>
    <div className={s.body}><AunorJourneys w={w} id={a.id}/><p className={s.state}>{a.not_performed_reason?<><b>No se realizó:</b> {a.not_performed_reason}</>:delivery?<><b>Entrega:</b> {delivery.confirmed_at?"Confirmada por Aunor.":"Pendiente de tu revisión."}</>:a.service_id?<><b>{a.status==="Programada"?"Planificación publicada.":"Entrega:"}</b> {a.status==="Programada"?"Jornadas aún por realizar.":"El material todavía no se ha publicado."}</>:<>Es un trabajo de Aunor. <b>Falta asociarlo a un servicio.</b></>}</p></div>
    <div className={s.footer}><ServiceTag a={a} w={w}/><Unread count={a.unread_count}/></div>
    <div className={s.footer+" "+s.white}><Link className={s.btn} href={activityHref(a.id)}>Ver actividad →</Link><span>Publicada para Aunor</span></div>
  </article>;
}
export function AunorConversation({w,id,role,mutate,pending}:{w:AunorWorkspace;id:string;role:Role;mutate:Mutation;pending:boolean}) {
  const [body,setBody]=useState(""),[corrects,setCorrects]=useState<string|null>(null);
  const list=w.messages.filter(m=>m.activity_id===id).sort((a,b)=>a.sequence-b.sequence);
  const unread=w.activities.find(a=>a.id===id)?.unread_count??0;
  const sentRef=useRef("");
  useEffect(()=>{
    const latest=list.at(-1)?.sequence;
    const token=id+":"+latest;
    if(unread&&latest&&sentRef.current!==token) {
      sentRef.current=token;
      void mutate("read",id,{sequence:latest});
    }
  },[id,list,unread,mutate]);
  return <section className={s.card+" "+s.chat} aria-label="Conversación externa">
    <header className={s.chatHead}><p className="data-label text-cyan-ink">Conversación externa</p><h2 className="section-title">Conversación con {role.id==="admin"?"Aunor":"Rhino"}</h2><p className={s.muted}>Solo Aunor y Admin. Este hilo corresponde a {w.activities.find(a=>a.id===id)?.title}.</p></header>
    <div className={s.messages}>{list.length?list.map(m=><article className={s.message+" "+(m.author_role==="admin"?s.rhino:"")} key={m.id}><header><strong>{m.author_role==="aunor"?"Aunor · cuenta compartida":"Admin · Rhino"}</strong><small>{moment(m.created_at)}</small></header>{m.corrects_id&&<small>Corrección del mensaje {m.corrects_id.slice(-8)}. El original se conserva.</small>}<p>{m.body}</p><small>Mensaje {m.id.slice(-8)}</small>{m.is_own&&<button type="button" onClick={()=>{setCorrects(m.id);setBody("");}}>Añadir corrección</button>}</article>):<p className={s.muted}>Todavía no hay mensajes. Puedes iniciar la conversación.</p>}</div>
    <form className={s.composer} onSubmit={async e=>{e.preventDefault();if(await mutate("message",id,{body,correctsId:corrects})){setBody("");setCorrects(null);}}}>
      {corrects&&<div className={s.notice}>Corriges el mensaje {corrects.slice(-8)}. <button type="button" onClick={()=>setCorrects(null)}>Cancelar corrección</button></div>}
      <label className={s.label}>Mensaje para {role.id==="admin"?"Aunor":"Rhino"}<textarea className={s.input} value={body} onChange={e=>setBody(e.target.value)} maxLength={5000} required rows={3}/></label>
      <div><Button type="submit" disabled={pending||!body.trim()}>{pending?"Guardando…":role.id==="admin"?"Enviar respuesta":"Enviar comentario"}</Button></div>
      <p className={s.muted}>Los comentarios no confirman entregas ni reemplazos automáticamente.</p>
    </form>
  </section>;
}
function ConfirmDelivery({w,id,mutate,pending}:{w:AunorWorkspace;id:string;mutate:Mutation;pending:boolean}) {
  const delivery=w.deliveries.find(d=>d.activity_id===id&&d.is_current);
  const [checked,setChecked]=useState("");
  return <aside className={s.card+" "+s.confirm}><div className={s.pad}><p className="data-label text-cyan-ink">Revisión de entrega</p><h2 className="section-title">{delivery?.confirmed_at?"Entrega confirmada":"Tu confirmación"}</h2>
    {!delivery?<p className={s.muted}>Rhino todavía no ha publicado una entrega vigente para revisar.</p>:<>
      <div className={s.box}><strong>{delivery.label}</strong>Entrega {delivery.id.slice(-8)} · versión {delivery.version}</div>
      {delivery.confirmed_at?<div className={s.stamp+" "+s.sectionGap}><strong>Confirmada por Aunor</strong><p>{moment(delivery.confirmed_at)} · cuenta compartida</p><p className={s.footnote}>La confirmación corresponde únicamente a esta entrega.</p></div>:<>
        <label className={s.check}><input type="checkbox" checked={checked===delivery.id} onChange={e=>setChecked(e.target.checked?delivery.id:"")}/><span>He revisado la entrega {delivery.id.slice(-8)} · versión {delivery.version} y la confirmo en nombre de Aunor.</span></label>
        <Button className="w-full" disabled={pending||checked!==delivery.id} onClick={()=>void mutate("confirm-delivery",id,{objectId:delivery.id,version:delivery.version,acknowledged:true})}>Confirmar esta entrega</Button>
      </>}
    </>}<p className={s.footnote}>{aunorDisclaimer}</p>
  </div></aside>;
}
function ActivityDetail({w,id,role,mutate,pending}:{w:AunorWorkspace;id:string;role:Role;mutate:Mutation;pending:boolean}) {
  const a=w.activities.find(a=>a.id===id);
  if(!a)return <div className={s.empty}>La actividad no está disponible para esta cuenta.</div>;
  const current=w.deliveries.find(d=>d.activity_id===id&&d.is_current);
  const replacements=w.replacements.filter(r=>r.original_activity_id===id||r.substitute_activity_id===id);
  return <div className={s.detail}>
    <section className={s.card}>
      <div className={s.hero+" technical-surface"}><p className="data-label">{a.type} · {aunorCode(a.id,a.type)}</p><h2>{a.title}</h2><p>{a.summary}</p><div className="status-in-hero mt-4"><StatusPill status={a.status}/></div></div>
      <dl className={s.meta}><div><dt>Jornadas publicadas</dt><dd><AunorJourneys w={w} id={id}/></dd></div><div><dt>Referencia</dt><dd><ServiceTag a={a} w={w}/></dd></div></dl>
      <div className={s.pad}><h2 className="section-title">Entrega</h2>{current?<div className={s.box}><strong>{current.label}</strong><p>Entrega {current.id.slice(-8)} · versión {current.version}</p><p className={s.footnote}>Publicada por Rhino · {moment(current.published_at)}</p>{safeMaterialUrl(current.material_link)&&<a className={s.btn+" "+s.primary+" "+s.sectionGap} href={safeMaterialUrl(current.material_link)!} target="_blank" rel="noopener noreferrer">Abrir material ↗</a>}</div>:<p className={s.muted}>El material todavía no se ha publicado para revisión.</p>}
      {w.deliveries.some(d=>d.activity_id===id&&!d.is_current)&&<details className={s.sectionGap}><summary>Entregas anteriores conservadas</summary>{w.deliveries.filter(d=>d.activity_id===id&&!d.is_current).map(d=><div key={d.id} className={s.box+" "+s.sectionGap}><strong>Entrega {d.id.slice(-8)} · versión {d.version}</strong><p>{d.confirmed_at?"Confirmada por Aunor el "+moment(d.confirmed_at):"Sin confirmación"}.</p><p className={s.muted}>No corresponde al material vigente.</p></div>)}</details>}
      {a.not_performed_reason&&<div className={s.notice+" "+s.sectionGap}><strong>No se realizó</strong><p>{a.not_performed_reason}</p></div>}
      </div>
      {replacements.length>0&&<div className={s.pad}><h2 className="section-title">Originales y sustitutos</h2>{replacements.map(r=><Link className={s.btn+" "+s.sectionGap} key={r.id} href={replacementHref(r.id)}>Ver relación {r.id.slice(-8)} →</Link>)}</div>}
    </section>
    <ConfirmDelivery w={w} id={id} mutate={mutate} pending={pending}/>
    <AunorConversation w={w} id={id} role={role} mutate={mutate} pending={pending}/>
    <AgreementList w={w} id={id}/>
  </div>;
}
export function AgreementList({w,id}:{w:AunorWorkspace;id:string}) {
  const agreements=w.agreements.filter(g=>g.activity_id===id);
  if(!agreements.length)return null;
  return <section className={s.card+" "+s.chat+" "+s.pad}><p className="data-label text-cyan-ink">Registro de contactos</p><h2 className="section-title">Acuerdos registrados por Rhino</h2>{agreements.map(g=><div className={s.box+" "+s.sectionGap} key={g.id}><strong>{g.channel} · {moment(g.contacted_at)}</strong><p>{g.body}</p>{!g.is_current&&<p className={s.notice}>Registro anterior corregido; se conserva como referencia.</p>}<dl className={s.facts}><div><dt>Solicitante declarado</dt><dd>{g.requester_declared}</dd></div><div><dt>Registrado por</dt><dd>{g.recorded_by} · {moment(g.recorded_at)}</dd></div></dl>{g.corrects_id&&<p className={s.muted}>Corrige el registro {g.corrects_id.slice(-8)}; el anterior se conserva.</p>}{safeMaterialUrl(g.evidence_link)&&<a className={s.link} href={safeMaterialUrl(g.evidence_link)!} target="_blank" rel="noopener noreferrer">Abrir evidencia ↗</a>}<p className={s.footnote}>Registro administrativo. El solicitante es declarado, no una identidad comprobada ni una confirmación de Aunor.</p></div>)}</section>;
}
export function ReplacementSummary({r,w,admin=false}:{r:AunorReplacement;w:AunorWorkspace;admin?:boolean}) {
  const href=(id:string)=>admin?"/actividades/"+encodeURIComponent(id):activityHref(id);
  const original=w.activities.find(a=>a.id===r.original_activity_id);
  const substitute=w.activities.find(a=>a.id===r.substitute_activity_id);
  return <><div className={s.replacement}><div className={s.box}><p className="data-label">Original · {aunorCode(r.original_activity_id,original?.type)}</p><strong>{r.original_title}</strong><p className={s.muted}>{original?.not_performed_reason?"No se realizó: "+original.not_performed_reason:"Original conservado"}</p><Link className={s.link} href={href(r.original_activity_id)}>Ver original →</Link></div><span className={s.arrow}>→</span><div className={s.box}><p className="data-label text-cyan-ink">Sustituto · {aunorCode(r.substitute_activity_id,substitute?.type)}</p><strong>{r.substitute_title}</strong><AunorJourneys w={w} id={r.substitute_activity_id}/><Link className={s.link} href={href(r.substitute_activity_id)}>Ver sustituto →</Link></div></div>
    <div className={s.stamp+" "+s.sectionGap}><strong>{!r.is_current?"Registro anterior conservado":r.confirmed_at?"Reemplazo confirmado por Aunor":"Pendiente de confirmación de Aunor"}</strong>{r.confirmed_at&&<p>{moment(r.confirmed_at)} · cuenta compartida</p>}<p className={s.footnote}>Relación {r.id.slice(-8)}. No implica equivalencia económica.</p></div></>;
}
function ReplacementDetail({w,id,mutate,pending}:{w:AunorWorkspace;id:string;mutate:Mutation;pending:boolean}) {
  const r=w.replacements.find(r=>r.id===id);const [checked,setChecked]=useState(false);
  if(!r)return <div className={s.empty}>El reemplazo no está disponible para esta cuenta.</div>;
  const g=w.agreements.find(g=>g.id===r.agreement_id);
  return <div className={s.detail}><section className={s.card+" "+s.pad}><p className="data-label text-cyan-ink">Relación {r.id.slice(-8)}</p><h2 className="section-title">Original y sustituto, juntos</h2><ReplacementSummary r={r} w={w}/><dl className={s.facts}><div><dt>Motivo</dt><dd>{r.reason}</dd></div><div><dt>Evidencia</dt><dd>{r.evidence_note}</dd></div><div><dt>Solicitante declarado</dt><dd>{g?.requester_declared??"Ver registro relacionado"}</dd></div><div><dt>Registrado por</dt><dd>{r.recorded_by} · {moment(r.recorded_at)}</dd></div></dl>{safeMaterialUrl(r.evidence_link)&&<a className={s.btn} href={safeMaterialUrl(r.evidence_link)!} target="_blank" rel="noopener noreferrer">Abrir evidencia ↗</a>}{g&&<div className={s.box}><strong>{g.channel} · {moment(g.contacted_at)}</strong><p>{g.body}</p></div>}</section>
      <aside className={s.card+" "+s.confirm+" "+s.pad}><h2 className="section-title">Tu confirmación</h2><p className={s.muted}>Confirma únicamente la relación {r.id.slice(-8)} entre el original y el sustituto identificados.</p>{!r.is_current?<p className={s.notice}>Registro anterior conservado. Revisa su corrección antes de confirmar.</p>:r.confirmed_at?<div className={s.stamp}><strong>Confirmado por Aunor</strong>{moment(r.confirmed_at)}</div>:<><label className={s.check}><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/><span>He revisado original, sustituto y evidencia; confirmo este reemplazo en nombre de Aunor.</span></label><Button disabled={!checked||pending} className="w-full" onClick={()=>void mutate("confirm-replacement",r.original_activity_id,{objectId:r.id,acknowledged:true})}>Confirmar este reemplazo</Button></>}<p className={s.footnote}>{aunorDisclaimer}</p></aside></div>;
}
function Agreed({w}:{w:AunorWorkspace}) {
  const [selected,setSelected]=useState(w.services[0]?.id??"");
  const related=w.activities.filter(a=>a.service_id===selected);
  const replacements=w.replacements.filter(r=>related.some(a=>a.id===r.original_activity_id||a.id===r.substitute_activity_id));
  return <><div className={s.notice}><strong>Una lista sencilla, sin porcentajes de cumplimiento</strong><p className={s.muted}>Referencia: cláusula 2.2 del contrato aportado. Las cantidades y equivalencias no se resuelven en esta vista.</p></div><div className={s.grid}>
    <section className={s.card+" "+s.pad}><p className="data-label text-cyan-ink">Lista simplificada de servicios</p><h2 className="section-title">Qué está previsto</h2>{w.services.map(service=><button className={s.service} key={service.id} type="button" aria-pressed={selected===service.id} onClick={()=>setSelected(service.id)}><strong>{service.label}</strong><small>Referencia contractual: {service.reference} · Ver trabajos relacionados →</small></button>)}<p className={s.footnote}>Nombres abreviados para lectura. Esta lista no modifica el texto firmado.</p></section>
    <div className={s.stack}><section className={s.card+" "+s.pad}><p className="data-label text-cyan-ink">Servicio seleccionado · 2.2</p><h2 className="section-title">{serviceName(w,selected)}</h2>{!related.length&&<p className={s.muted}>Todavía no hay trabajos relacionados con este servicio.</p>}{related.map(a=><div className={s.box+" "+s.sectionGap} key={a.id}><strong>{a.title}</strong><p>{a.not_performed_reason?"No se realizó: "+a.not_performed_reason:a.status==="Entregada"?"Trabajo realizado. La confirmación de su entrega es independiente.":a.status}</p><Link className={s.link} href={activityHref(a.id)}>Ver actividad →</Link></div>)}{replacements.map(r=><div className={s.sectionGap} key={r.id}><ReplacementSummary r={r} w={w}/><Link className={s.btn+" "+s.sectionGap} href={replacementHref(r.id)}>Ver original, sustituto y evidencia →</Link></div>)}</section>
    <section className={s.card+" "+s.pad}><p className="data-label text-cyan-ink">Trabajo visible de Aunor</p><h2 className="section-title">Por relacionar</h2>{w.activities.filter(a=>!a.service_id).map(a=><div className={s.box+" "+s.sectionGap} key={a.id}><strong>{a.title}</strong><AunorJourneys w={w} id={a.id}/><p className={s.muted}>Todavía no tiene un servicio contractual asociado.</p><Link className={s.link} href={activityHref(a.id)}>Ver actividad →</Link></div>)}{!w.activities.some(a=>!a.service_id)&&<p className={s.muted}>No hay trabajos pendientes de relacionar.</p>}<p className={s.footnote}>El trabajo y su entrega siguen visibles aunque falte esta relación.</p></section></div></div></>;
}
function Inbox({w}:{w:AunorWorkspace}) {
  const items=w.activities.filter(a=>w.messages.some(m=>m.activity_id===a.id)).sort((a,b)=>b.unread_count-a.unread_count);
  return <><div className={s.card}>{items.length?items.map(a=><article className={s.inbox} key={a.id}><div className={s.bubble}><SystemIcon name="messages" className="size-5"/></div><div><p className="data-label text-cyan-ink">{a.type} · {aunorCode(a.id,a.type)}</p><h2 className="section-title">{a.title}</h2><p>{w.messages.filter(m=>m.activity_id===a.id).sort((a,b)=>b.sequence-a.sequence)[0]?.body}</p><Unread count={a.unread_count}/></div><Link className={s.btn} href={activityHref(a.id)}>Abrir conversación →</Link></article>):<p className={s.empty}>Todavía no hay conversaciones.</p>}</div><p className={s.footnote}>La lectura se comparte entre quienes utilizan la cuenta Aunor. Un mensaje leído no significa una entrega confirmada.</p></>;
}
function PublicCalendarDetail({w,item,titleId,close,closeButtonRef,choices,onChoose}:{w:AunorWorkspace}&CalendarDetailProps) {
  const a=w.activities.find(a=>a.id===item.id);
  if(!a)return null;
  return <aside className={s.calendarDetail} aria-labelledby={titleId}>{close&&<button className={s.close} type="button" aria-label="Cerrar detalle" ref={closeButtonRef} onClick={close}>×</button>}
    {choices.length>1&&<section><p className="data-label">{choices.length} actividades en esta fecha</p>{choices.map(c=><button className={s.choice} key={c.id} type="button" aria-pressed={c.id===a.id} onClick={()=>onChoose(c)}><strong>{c.title}</strong><small>{aunorCode(c.id,c.type)} · {c.spans.map(j=>j.place||c.place).join(" · ")}</small></button>)}</section>}
    <StatusPill status={a.status}/><p className="data-label mt-5 text-cyan-ink">{a.type}</p><h2 className="section-title" id={titleId}>{a.title}</h2><AunorJourneys w={w} id={a.id}/><p className={s.state}>{a.summary}</p><div className={s.sectionGap}><ServiceTag w={w} a={a}/></div><Link className={s.btn+" "+s.primary+" "+s.sectionGap} href={activityHref(a.id)}>Ver entrega y conversación →</Link>
  </aside>;
}
export function AunorSpace({initial,role,scene,id="",demo=false,year=2026,today="2026-09-06"}:{initial:AunorWorkspace;role:Role;scene:AunorScene;id?:string;demo?:boolean;year?:number;today?:string}) {
  const [w,setW]=useState(initial),[error,setError]=useState(""),[notice,setNotice]=useState(""),[query,setQuery]=useState(""),[category,setCategory]=useState("");
  const [pending,startTransition]=useTransition();
  const requests=useRef(new Map<string,string>());
  const mutate:Mutation=useCallback(async(command,activityId,payload)=>{
    const key=JSON.stringify([command,activityId,payload]);
    const requestId=requests.current.get(key)??crypto.randomUUID();requests.current.set(key,requestId);
    return await new Promise<boolean>(resolve=>startTransition(async()=>{
      setError("");
      const r=await performAunorAction({command,activityId,requestId,payload});
      if(!r.ok){setError(r.error);resolve(false);return;}
      requests.current.delete(key);
      const fresh=await getAunorWorkspaceAction();
      if(fresh.ok)setW(fresh.data);else setError(fresh.error);
      if(command!=="read")setNotice(command.startsWith("confirm-")?"Confirmación guardada para el objeto revisado.":"Registro guardado.");
      resolve(true);
    }));
  },[]);
  async function refresh(){const r=await getAunorWorkspaceAction();if(r.ok){setW(r.data);setError("");}else setError(r.error);}
  useEffect(()=>{
    let active=true,inFlight=false;
    const poll=async()=>{
      if(document.visibilityState!=="visible"||inFlight)return;
      inFlight=true;
      try{const result=await getAunorWorkspaceAction();if(active){if(result.ok)setW(result.data);else setError(result.error);}}
      catch{if(active)setError("No se pudo actualizar la conversación. Reintenta cuando vuelva la conexión.");}
      finally{inFlight=false;}
    };
    const timer=setInterval(()=>void poll(),30_000);
    window.addEventListener("focus",poll);
    return ()=>{active=false;clearInterval(timer);window.removeEventListener("focus",poll);};
  },[]);
  const visible=w.activities.filter(a=>(!category||a.type===category)&&(a.title+" "+aunorCode(a.id,a.type)).toLowerCase().includes(query.toLowerCase()));
  const names={panel:["Tus actividades","Días, lugares, entregas y conversaciones con Rhino."],detail:["Detalle de actividad","Información publicada para Aunor."],acordado:["Lo acordado","Los servicios previstos y el trabajo que se relaciona con ellos."],messages:["Mensajes","Una conversación por actividad."],calendar:["Calendario anual","Las jornadas publicadas, sin perder ninguna actividad coincidente."],replacement:["Reemplazo documentado","Original, sustituto, motivo y evidencia conservados."]};
  return <main className={s.page}>{demo&&<div className={s.demo}><strong>DEMOSTRACIÓN AISLADA · EJEMPLOS FICTICIOS</strong><p>No son datos contractuales reales. Los cambios de esta demostración viven en el servidor local y se reinician al detenerlo.</p></div>}
    <header className={s.head}><p className="data-label text-cyan-ink">Espacio Aunor · acceso compartido</p><h1 className="section-title">{names[scene][0]}</h1><p>{names[scene][1]}</p></header>
    {error&&<div className={s.error} role="alert">{error} <button type="button" onClick={()=>void refresh()}>Reintentar</button></div>}{notice&&<p role="status" className={s.notice}>{notice}</p>}
    {(scene==="panel"||scene==="calendar")&&<div className={s.tools}><nav className={s.tabs} aria-label="Vista de actividades"><Link className={scene==="panel"?s.selected:""} href="/aunor">Actividades</Link><Link className={scene==="calendar"?s.selected:""} href="/aunor/calendario">Calendario anual</Link></nav>{scene==="panel"&&<><label className={s.search}><span className="sr-only">Buscar por nombre o código</span><input className={s.input} placeholder="Buscar por nombre o código" value={query} onChange={e=>setQuery(e.target.value)}/></label></> }<label><span className="sr-only">Categoría</span><select className={s.input} value={category} onChange={e=>setCategory(e.target.value)}><option value="">Todas las categorías</option>{[...new Set(w.activities.map(a=>a.type))].map(t=><option key={t}>{t}</option>)}</select></label><Button variant="secondary" onClick={()=>void refresh()}>Actualizar</Button></div>}
    {scene==="panel"&&<>{w.activities.some(a=>a.unread_count>0)&&<div className={s.notice}><strong>Hay respuestas nuevas de Rhino</strong><p className={s.muted}>Revisa cada conversación dentro de su actividad.<Link href="/aunor/mensajes">Ver mensajes →</Link></p></div>}<div className={s.grid}>{visible.map(a=><AunorActivityCard key={a.id} a={a} w={w}/>)}</div>{!visible.length&&<p className={s.empty}>No hay actividades publicadas que coincidan con esta búsqueda.</p>}<p className={s.footnote}>“Por relacionar” no oculta el trabajo: solo indica que falta su referencia en Lo acordado.</p></>}
    {scene==="detail"&&<ActivityDetail key={id} w={w} id={id} role={role} mutate={mutate} pending={pending}/>}
    {scene==="acordado"&&<Agreed w={w}/>}
    {scene==="messages"&&<Inbox w={w}/>}
    {scene==="replacement"&&<ReplacementDetail key={id} w={w} id={id} mutate={mutate} pending={pending}/>}
    {scene==="calendar"&&<AnnualCalendarView publicMode basePath="/aunor/calendario" activities={w.activities.filter(a=>!category||a.type===category).map(a=>({id:a.id,type:a.type,title:a.title,status:a.status,place:a.place,spans:w.journeys.filter(j=>j.activity_id===a.id).map(j=>({start:j.start_date,end:j.end_date,place:j.place}))}))} year={year} today={today} renderDetail={props=><PublicCalendarDetail {...props} w={w}/>}/>}
  </main>;
}
