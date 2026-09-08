import "server-only";
import { createAunorExamples } from "@/lib/aunor-examples";
import { canMutateAunor, type AunorCommand, type AunorWorkspace } from "@/lib/aunor";
import type { ActivityType, Role } from "@/lib/roles";
import { safeMaterialUrl } from "@/lib/external-link";

export type DemoAunorSource = {
  id: string; type: ActivityType; title: string; status: "Programada"|"En proceso"|"Entregada";
  place: string; spans: {start:string;end:string;place?:string}[];
  materialLink: string; version: number; origin: "operario"|"burson"; deletedAt?: string;
};
type State = { workspace:AunorWorkspace; requests:Map<string,{hash:string;result:Record<string,unknown>}>; reads:Map<string,number>; sources:Map<string,DemoAunorSource> };
const memory=globalThis as typeof globalThis & { __sistemaRAunorDemo?:State };
function state() {
  if(!memory.__sistemaRAunorDemo) memory.__sistemaRAunorDemo={workspace:createAunorExamples(),requests:new Map(),reads:new Map(),sources:new Map()};
  return memory.__sistemaRAunorDemo;
}
export function readDemoAunor(role:Role):AunorWorkspace {
  const s=state(); const w=structuredClone(s.workspace);
  for(const a of w.activities) a.unread_count=w.messages.filter(m=>m.activity_id===a.id && m.author_role!==role.id && m.sequence>(s.reads.get(role.accountId+":"+a.id)??0)).length;
  for(const m of w.messages) m.is_own=m.author_role===role.id; // One collective Aunor identity in demo.
  return w;
}
export function mutateDemoAunor(role:Role,command:AunorCommand,activityId:string,requestId:string,p:Record<string,unknown>,source?:DemoAunorSource) {
  if(!canMutateAunor(role,command)) throw Error("No tienes permiso para esta acción.");
  const s=state(),w=structuredClone(s.workspace);
  const a=w.activities.find(a=>a.id===activityId);
  if(command!=="publish"&&!a) throw Error("La actividad no está publicada para Aunor.");
  if(source && (role.id!=="admin" || source.id!==activityId || source.origin==="burson" || source.deletedAt)) throw Error("Actividad no disponible para publicar.");
  const hash=JSON.stringify([command,activityId,p]),key=role.accountId+":"+requestId;
  const previous=s.requests.get(key);
  if(previous) { if(previous.hash!==hash) throw Error("La clave de reintento pertenece a otra acción."); return previous.result; }
  const now=new Date().toISOString(),id=crypto.randomUUID();
  const text=(key:string,min=0,max=5000)=>{ const value=p[key]; if(typeof value!=="string" || value.trim().length<min || value.trim().length>max) throw Error("Revisa los campos de "+key+"."); return value.trim(); };
  const link=(key:string)=>{ const value=typeof p[key]==="string"?p[key].trim():""; if(value&&!safeMaterialUrl(value)) throw Error("Usa un enlace HTTPS válido."); return value; };
  const correction=typeof p.correctsId==="string"&&p.correctsId?p.correctsId:null;
  const result:Record<string,unknown>={id};
  if(command==="publish") {
    if(!source || !source.title?.trim() || !Array.isArray(source.spans)) throw Error("Revisa la actividad antes de publicarla.");
    if(p.expectedVersion!==(a?.publication_version??0)) throw Error("La publicación cambió; recarga.");
    const summary=text("summary",1);
    const service=typeof p.serviceId==="string"&&p.serviceId?p.serviceId:null;
    const reason=typeof p.notPerformedReason==="string"?p.notPerformedReason.trim():"";
    if(service&&!w.services.some(s=>s.id===service)) throw Error("Servicio no disponible.");
    if(reason&&source.status==="Entregada") throw Error("Una actividad entregada no puede registrarse como no realizada.");
    const row={id:source.id,type:source.type,title:source.title,status:source.status,place:source.place,summary,service_id:service,not_performed_reason:reason,publication_version:(a?.publication_version??0)+1,published_at:now,unread_count:0};
    w.activities=w.activities.filter(a=>a.id!==activityId).concat(row);
    w.journeys=w.journeys.filter(j=>j.activity_id!==activityId).concat(source.spans.map((j,i)=>({activity_id:activityId,position:i+1,start_date:j.start,end_date:j.end,place:j.place||source.place})));
    for(const d of w.deliveries.filter(d=>d.activity_id===activityId)) if(d.material_link!==source.materialLink) d.is_current=false;
    s.sources.set(activityId,structuredClone(source));
    result.version=row.publication_version;
  } else if(command==="delivery") {
    const internal=source??s.sources.get(activityId);
    if(!internal || internal.status!=="Entregada" || !safeMaterialUrl(internal.materialLink) || p.expectedActivityVersion!==internal.version) throw Error("Recarga una actividad entregada antes de publicar su material.");
    for(const d of w.deliveries.filter(d=>d.activity_id===activityId)) d.is_current=false;
    const version=Math.max(0,...w.deliveries.filter(d=>d.activity_id===activityId).map(d=>d.version))+1;
    w.deliveries.push({id,activity_id:activityId,version,material_link:internal.materialLink,label:text("label",1,180),published_at:now,confirmed_at:null,confirmed_by:null,is_current:true});
    result.version=version;
  } else if(command==="message") {
    if(correction&&!w.messages.some(m=>m.id===correction&&m.activity_id===activityId&&m.author_role===role.id)) throw Error("Solo puedes corregir mensajes propios de este hilo.");
    w.messages.push({id,sequence:Math.max(0,...w.messages.map(m=>m.sequence))+1,activity_id:activityId,author:role.id==="aunor"?"Aunor":"Admin · Rhino",author_role:role.id==="aunor"?"aunor":"admin",body:text("body",1),created_at:now,corrects_id:correction,is_own:true});
  } else if(command==="read") {
    const sequence=Number(p.sequence);
    if(sequence!==0&&!w.messages.some(m=>m.activity_id===activityId&&m.sequence===sequence)) throw Error("Posición de lectura inválida.");
    s.reads.set(role.accountId+":"+activityId,Math.max(sequence,s.reads.get(role.accountId+":"+activityId)??0));
  } else if(command==="agreement") {
    if(!["Llamada","Reunión","Acuerdo verbal"].includes(String(p.channel))||!Number.isFinite(Date.parse(String(p.contactedAt)))) throw Error("Indica canal y fecha de contacto.");
    if(correction&&!w.agreements.some(g=>g.id===correction&&g.activity_id===activityId&&g.is_current)) throw Error("Acuerdo no disponible.");
    if(correction) w.agreements.find(g=>g.id===correction)!.is_current=false;
    w.agreements.push({id,activity_id:activityId,channel:String(p.channel),contacted_at:String(p.contactedAt),requester_declared:text("requesterDeclared",2,180),body:text("body",2),evidence_link:link("evidenceLink"),recorded_by:"Admin · Rhino",recorded_at:now,corrects_id:correction,is_current:true});
  } else if(command==="replacement") {
    const other=w.activities.find(a=>a.id===p.substituteId);
    const agreement=w.agreements.find(g=>g.id===p.agreementId&&(g.activity_id===activityId||g.activity_id===other?.id));
    if(!a||!other||other.id===a.id||!agreement) throw Error("Selecciona original, sustituto publicado y acuerdo relacionado.");
    if(correction) {
      const prior=w.replacements.find(r=>r.id===correction&&r.original_activity_id===activityId&&r.is_current);
      if(!prior) throw Error("Reemplazo no disponible para corregir.");
      prior.is_current=false;
    }
    w.replacements.push({id,original_activity_id:a.id,substitute_activity_id:other.id,original_title:a.title,substitute_title:other.title,agreement_id:agreement.id,reason:text("reason",2,3000),evidence_note:text("evidenceNote",2,3000),evidence_link:link("evidenceLink"),recorded_by:"Admin · Rhino",recorded_at:now,corrects_id:correction,confirmed_at:null,confirmed_by:null,is_current:true});
  } else if(command==="confirm-delivery") {
    const d=w.deliveries.find(d=>d.id===p.objectId&&d.activity_id===activityId);
    if(p.acknowledged!==true||!d||!d.is_current||d.version!==p.version) throw Error("Revisa y confirma explícitamente la entrega vigente.");
    d.confirmed_at??=now;d.confirmed_by="Aunor";result.id=d.id;result.objectId=d.id;
  } else if(command==="confirm-replacement") {
    const r=w.replacements.find(r=>r.id===p.objectId&&r.original_activity_id===activityId);
    if(p.acknowledged!==true||!r||!r.is_current) throw Error("Revisa y confirma explícitamente el reemplazo vigente.");
    r.confirmed_at??=now;r.confirmed_by="Aunor";result.id=r.id;result.objectId=r.id;
  }
  s.workspace=w;
  s.requests.set(key,{hash,result});
  return result;
}
