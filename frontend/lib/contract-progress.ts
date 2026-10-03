import type { AunorWorkspace } from "./aunor";
import { activityContractPeriod, type ContractIndex } from "./contract-calendar";
export type ContractPeriod = {id:string;service_id:string;cadence:"monthly"|"annual";starts_on:string;ends_on:string;target:number|null;version:number};

/** One activity, one unit. Never multiply Special, spans or delivery versions. */
export function contractProgress(w:AunorWorkspace, serviceId:string, period?:ContractPeriod, index?:ContractIndex) {
  const replaced = index?.replaced ?? new Set(w.replacements.filter(r=>r.is_current).map(r=>r.original_activity_id));
  const unique = index ? [...(index.activities.get(serviceId)?.values() ?? [])] : [...new Map(w.activities.filter(a=>a.service_id===serviceId).map(a=>[a.id,a])).values()];
  const eligible=unique.filter(a=>!a.not_performed_reason && !replaced.has(a.id));
  const resolved = new Map(eligible.map(a => [a.id, activityContractPeriod(w, a, index)]));
  const assigned=period ? eligible.filter(a=>resolved.get(a.id)?.id===period.id) : [];
  const delivered=assigned.filter(a=>a.status==="Entregada");
  const pending=assigned.filter(a=>a.status!=="Entregada");
  const unassigned=eligible.filter(a=>!resolved.get(a.id));
  const target=period?.target ?? null;
  return {delivered,pending,unassigned,excluded:unique.filter(a=>Boolean(a.not_performed_reason) || replaced.has(a.id)),target,count:delivered.length,
    excess:target===null?0:Math.max(0,delivered.length-target),
    ratio:target===null?`${delivered.length} / —`:`${delivered.length}/${target}`};
}

export function periodLabel(p:ContractPeriod) {
  const format=new Intl.DateTimeFormat("es-PE",{month:"long",year:"numeric",timeZone:"UTC"});
  return p.cadence==="monthly" ? format.format(new Date(`${p.starts_on}T12:00:00Z`)) : `${p.starts_on} — ${p.ends_on}`;
}
