import {expect,it} from "vitest";
import {activityStoreKey,parseActivityStore,readActivities,classifyActivity,regularizeHistoricalActivity,type ActivityActor} from "@/lib/activity-simulation";
import {activityPlanningError} from "@/lib/activity-validation";
import type {ActivityDraftFields} from "@/lib/activity-draft";
import {effectiveSpans} from "@/lib/activities";
import {activityOverlapsYear} from "@/lib/historical";
const admin:ActivityActor={accountId:"account-admin",name:"Admin",roleId:"admin",roleLabel:"Admin"};
function fixture(){
 const item={...parseActivityStore(null)[0],status:"En proceso" as const,origin:"operario" as const,deliveredAt:undefined,spans:[{start:"2026-04-02",end:"2026-04-02",place:"Lugar conservado"}],materialLink:"https://example.invalid/final"};
 const map=new Map([[activityStoreKey,JSON.stringify([item])]]);
 return {item,storage:{getItem:(key:string)=>map.get(key) ?? null,setItem:(key:string,value:string)=>{map.set(key,value);}}};
}
it("clasificar no cambia estado, material ni fechas; deniega Operario y versión obsoleta",()=>{
 const {item,storage}=fixture();
 expect(classifyActivity(storage,item.id,{...admin,roleId:"operario"},item.version,"special").ok).toBe(false);
 expect(classifyActivity(storage,item.id,admin,item.version-1,"special").ok).toBe(false);
 const result=classifyActivity(storage,item.id,admin,item.version,"special");expect(result.ok).toBe(true);
 if(result.ok){expect(result.activity).toMatchObject({status:item.status,materialLink:item.materialLink,spans:item.spans,classification:"special"});expect(result.activity.audit[0].action).toBe("Clasificación actualizada");}
});
it("regulariza sobre la misma actividad sin inventar fecha de entrega y conserva el historial",()=>{
 const {item,storage}=fixture();
 expect(regularizeHistoricalActivity(storage,item.id,admin,item.version,false).ok).toBe(false);
 const result=regularizeHistoricalActivity(storage,item.id,admin,item.version,true);expect(result.ok).toBe(true);
 if(result.ok){expect(result.activity).toMatchObject({id:item.id,status:"Entregada",spans:item.spans,materialLink:item.materialLink});expect(result.activity.deliveredAt).toBeUndefined();expect(result.activity.historicalRegularizedAt).toBeTruthy();expect(result.activity.audit.slice(1)).toEqual(item.audit);}
 expect(readActivities(storage)).toHaveLength(1);
});
it("valida la entrega prevista de Edición sin exigir descripción ni lugares",()=>{
 const fields:ActivityDraftFields={type:"Edición",title:"Proyecto de edición",description:"",placeName:"",responsibleAccountId:"",spans:[],materialLink:"",notes:"",referenceLink:"",deliveryDueOn:"2026-04-20"};
 expect(activityPlanningError(fields)).toBeNull();expect(activityPlanningError({...fields,deliveryDueOn:"2026-02-30"})).not.toBeNull();
 expect(activityPlanningError({...fields,type:"Locución"})).not.toBeNull();
});
it("el calendario usa el vencimiento sin mutar las jornadas antiguas",()=>{
 const spans=[{start:"2026-04-01",end:"2026-04-03",place:"Legado"}], item={spans,deliveryDueOn:"2027-01-15"};
 expect(effectiveSpans(item)).toEqual([{start:"2027-01-15",end:"2027-01-15"}]);
 expect(activityOverlapsYear(item,2026)).toBe(false);expect(activityOverlapsYear(item,2027)).toBe(true);expect(item.spans).toBe(spans);
});
