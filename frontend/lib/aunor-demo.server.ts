import "server-only";
import { createAunorExamples } from "@/lib/aunor-examples";
import { canMutateAunor, canUseAunor, type AunorCommand, type AunorWorkspace } from "@/lib/aunor";
import type { ActivityType, Role } from "@/lib/roles";
import { safeMaterialUrl } from "@/lib/external-link";
import type { ContractPeriod } from "@/lib/contract-progress";
import type { AdminActivityInput } from "@/lib/admin-activity-management";
import type { HistoricalRegistration } from './historical-registration';
import { historicalRegistrationError } from './historical-registration';
import type { SimulatedActivity } from './activity-simulation';

export function registerDemoHistorical(role:Role,p:HistoricalRegistration,key:string,responsible:string):SimulatedActivity {
  if(role.id!=='admin'||!canUseAunor(role)||historicalRegistrationError(p))throw Error('Registro no autorizado o incompleto');
  const s=state(),requestKey=role.accountId+':'+key,hash=JSON.stringify(['historical-registration',p]);
  const prior=s.requests.get(requestKey);
  if(prior){if(prior.hash!==hash)throw Error('Reintento distinto');return structuredClone(prior.result.activity as SimulatedActivity);}
  const snapshot=structuredClone(s),now=new Date().toISOString();
  const activity:SimulatedActivity={id:crypto.randomUUID(),type:p.type,title:p.title.trim(),responsible,responsibleAccountId:p.responsibleAccountId,
    status:'Entregada',origin:'operario',spans:p.type==='Edición'?[{start:p.deliveryDueOn!,end:p.deliveryDueOn!,place:'Lima'}]:p.spans,
    description:p.type==='Edición'?'':p.description.trim(),place:p.type==='Edición'?'Lima':p.placeName.trim(),materialLink:p.materialLink.trim(),operatorOpinion:'',
    recordingModes:p.recordingModes??[],classification:p.classification??null,deliveryDueOn:p.type==='Edición'?p.deliveryDueOn:null,historicalRegularizedAt:now,
    createdByAccountId:role.accountId!,createdByRoleId:'admin',createdAt:now,updatedAt:now,version:2,referenceLink:'',detailHydration:'complete',thread:[],
    audit:[{action:'Trabajo histórico registrado',moment:now,actor:{accountId:role.accountId!,name:role.accountName??'Admin',roleId:'admin',roleLabel:'Admin'},detail:'Confirmado por Admin. Se conserva la fecha del trabajo.'}]};
  try {
    mutateDemoAunor(role,'publish',activity.id,crypto.randomUUID(),{expectedVersion:0,summary:p.description.trim()||p.title.trim(),serviceId:p.serviceId,notPerformedReason:''},activity);
    s.requests.set(requestKey,{hash,result:{activity}});return structuredClone(activity);
  }catch(error){memory.__sistemaRAunorDemo=snapshot;throw error;}
}

/** Synthetic memory only: commit both records or restore the complete prior state. */
export function mutateDemoAdminActivity(role:Role,input:AdminActivityInput,source?:DemoAunorSource) {
  if(role.id!=="admin" || !canUseAunor(role)) throw Error("Solo Admin");
  const s=state(),key=role.accountId+":"+input.requestId,hash=JSON.stringify(['admin-bundle',input]);
  const previous=s.requests.get(key);
  if(previous){if(previous.hash!==hash)throw Error('Reintento distinto');return previous.result;}
  const snapshot=structuredClone(s);
  try {
    if(source && source.version!==input.activityVersion) throw Error('Actividad cambiada');
    if(input.command==='relation') {
      if(input.periodId && !s.workspace.contractPeriods?.some(p=>p.id===input.periodId && p.service_id===input.serviceId)) throw Error('Periodo incompatible');
      const publication=mutateDemoAunor(role,'publish',input.activityId,crypto.randomUUID(),{
        expectedVersion:input.publicationVersion,summary:input.summary,serviceId:input.serviceId,notPerformedReason:input.notPerformedReason,
      },source);
      assignDemoContractPeriod(role,input.activityId,Number(publication.version),input.periodId);
    } else {
      const w=s.workspace;
      if(w.replacements.some(r=>r.original_activity_id===input.originalId && r.is_current)) throw Error('Original reemplazado');
      let agreementId=input.agreementId;
      if(agreementId && !w.agreements.some(g=>g.id===agreementId && g.is_current && [input.originalId,input.activityId].includes(g.activity_id))) throw Error('Acuerdo cambiado');
      if(!agreementId) agreementId=String(mutateDemoAunor(role,'agreement',input.originalId,crypto.randomUUID(),{
        channel:input.channel,contactedAt:input.contactedAt,requesterDeclared:input.requesterDeclared,body:input.reason,evidenceLink:input.evidenceLink,
      }).id);
      mutateDemoAunor(role,'replacement',input.originalId,crypto.randomUUID(),{
        substituteId:input.activityId,agreementId,reason:input.reason,evidenceNote:input.reason,evidenceLink:input.evidenceLink,
      });
    }
    const result={ok:true};s.requests.set(key,{hash,result});return result;
  } catch(error){memory.__sistemaRAunorDemo=snapshot;throw error;}
}

export function configureDemoContractPeriod(role:Role,p:Omit<ContractPeriod,"id"|"version"> & {id?:string;version?:number}) {
  if(!canUseAunor(role) || role.id!=="admin") throw Error("Solo Admin");
  const w=state().workspace, periods=w.contractPeriods ?? [];
  if(!w.services.some(s=>s.id===p.service_id) || periods.some(other=>other.id!==p.id && other.service_id===p.service_id && other.starts_on<=p.ends_on && other.ends_on>=p.starts_on)) throw Error("Periodo superpuesto");
  const old=periods.find(other=>other.id===p.id);
  if(p.id && (!old || old.version!==p.version || old.starts_on!==p.starts_on || old.ends_on!==p.ends_on || old.cadence!==p.cadence || old.service_id!==p.service_id)) throw Error("Periodo cambiado");
  w.contractPeriods=[...periods.filter(other=>other.id!==p.id),{...p,id:p.id ?? crypto.randomUUID(),version:(old?.version ?? 0)+1}];
}
export function assignDemoContractPeriod(role:Role,id:string,version:number,periodId:string|null) {
  if(!canUseAunor(role) || role.id!=="admin") throw Error("Solo Admin");
  const w=state().workspace,a=w.activities.find(a=>a.id===id);
  if(!a || a.publication_version!==version || (periodId && !(w.contractPeriods ?? []).some(p=>p.id===periodId && p.service_id===a.service_id))) throw Error("Periodo no válido");
  a.contract_period_id=periodId;
}

export type DemoAunorSource = {
  classification?: import("./activity-classification").ActivityClassification | null;
  deliveryDueOn?: string|null; historicalRegularizedAt?: string|null;
  recordingModes?: import("@/lib/recording-modes").RecordingMode[];
  id: string; type: ActivityType; title: string; status: "Programada"|"En proceso"|"Entregada";
  place: string; spans: {start:string;end:string;place?:string}[];
  materialLink: string; version: number; origin: "operario"|"burson"; deletedAt?: string; deliveredAt?: string;
};
type State = { workspace:AunorWorkspace; requests:Map<string,{hash:string;result:Record<string,unknown>}>; reads:Map<string,number>; sources:Map<string,DemoAunorSource> };
const memory=globalThis as typeof globalThis & { __sistemaRAunorDemo?:State };
function state() {
  if(!memory.__sistemaRAunorDemo) memory.__sistemaRAunorDemo={workspace:createAunorExamples(),requests:new Map(),reads:new Map(),sources:new Map()};
  return memory.__sistemaRAunorDemo;
}
export function readDemoAunor(role:Role):AunorWorkspace {
  if (!canUseAunor(role)) throw Error("Acceso no autorizado.");
  const s=state(); const w=structuredClone(s.workspace);
  for(const a of w.activities) a.unread_count=0;
  w.messages=[]; // Archived in server memory; never serialized to clients.
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
    const row={id:source.id,type:source.type,title:source.title,status:source.status,place:source.place,summary,service_id:service,not_performed_reason:reason,publication_version:(a?.publication_version??0)+1,published_at:now,unread_count:0,delivered_at:source.deliveredAt ?? a?.delivered_at ?? null,material_link:source.status==="Entregada" ? source.materialLink : ""};
    w.activities=w.activities.filter(a=>a.id!==activityId).concat({...row,recording_modes:source.recordingModes ?? [],
      contract_period_id:a?.service_id===service ? a?.contract_period_id ?? null : null,
      classification:source.classification ?? null,delivery_due_on:source.deliveryDueOn ?? null,historical_regularized_at:source.historicalRegularizedAt ?? null});
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
    w.messages.push({id,sequence:Math.max(0,...w.messages.map(m=>m.sequence))+1,activity_id:activityId,author:role.id==="aunor"?"Aunor":"Admin · DA VINCI",author_role:role.id==="aunor"?"aunor":"admin",body:text("body",1),created_at:now,corrects_id:correction,is_own:true});
  } else if(command==="read") {
    const sequence=Number(p.sequence);
    if(sequence!==0&&!w.messages.some(m=>m.activity_id===activityId&&m.sequence===sequence)) throw Error("Posición de lectura inválida.");
    s.reads.set(role.accountId+":"+activityId,Math.max(sequence,s.reads.get(role.accountId+":"+activityId)??0));
  } else if(command==="agreement") {
    if(!["Llamada","Reunión","Acuerdo verbal"].includes(String(p.channel))||!Number.isFinite(Date.parse(String(p.contactedAt)))) throw Error("Indica canal y fecha de contacto.");
    if(correction&&!w.agreements.some(g=>g.id===correction&&g.activity_id===activityId&&g.is_current)) throw Error("Acuerdo no disponible.");
    if(correction) w.agreements.find(g=>g.id===correction)!.is_current=false;
    w.agreements.push({id,activity_id:activityId,channel:String(p.channel),contacted_at:String(p.contactedAt),requester_declared:text("requesterDeclared",2,180),body:text("body",2),evidence_link:link("evidenceLink"),recorded_by:"Admin · DA VINCI",recorded_at:now,corrects_id:correction,is_current:true});
  } else if(command==="replacement") {
    const other=w.activities.find(a=>a.id===p.substituteId);
    const agreement=w.agreements.find(g=>g.id===p.agreementId&&(g.activity_id===activityId||g.activity_id===other?.id));
    if(!a||!other||other.id===a.id||!agreement) throw Error("Selecciona original, sustituto publicado y acuerdo relacionado.");
    if(correction) {
      const prior=w.replacements.find(r=>r.id===correction&&r.original_activity_id===activityId&&r.is_current);
      if(!prior) throw Error("Reemplazo no disponible para corregir.");
      prior.is_current=false;
    }
    w.replacements.push({id,original_activity_id:a.id,substitute_activity_id:other.id,original_title:a.title,substitute_title:other.title,agreement_id:agreement.id,reason:text("reason",2,3000),evidence_note:text("evidenceNote",2,3000),evidence_link:link("evidenceLink"),recorded_by:"Admin · DA VINCI",recorded_at:now,corrects_id:correction,confirmed_at:null,confirmed_by:null,is_current:true});
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
