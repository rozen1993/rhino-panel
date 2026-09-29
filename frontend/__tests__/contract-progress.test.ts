import { expect,it } from "vitest";
import { contractProgress, type ContractPeriod } from "@/lib/contract-progress";
import { emptyAunorWorkspace, type AunorActivityRow } from "@/lib/aunor";
const period:ContractPeriod={id:"p",service_id:"cobertura",cadence:"monthly",starts_on:"2026-04-01",ends_on:"2026-04-30",target:10,version:1};
const activity=(id:string,patch:Partial<AunorActivityRow>={}):AunorActivityRow=>({id,type:"Grabación",title:id,status:"Entregada",place:"",summary:"",service_id:"cobertura",not_performed_reason:"",publication_version:7,published_at:"2026-09-28T12:00:00Z",unread_count:0,contract_period_id:"p",...patch});
it("muestra 15/10 y conserva cinco adicionales en su periodo; Especial no multiplica",()=>{
 const w={...emptyAunorWorkspace(),contractPeriods:[period],activities:Array.from({length:15},(_,i)=>activity(String(i),{classification:"special"}))};
 const result=contractProgress(w,"cobertura",period);expect(result.ratio).toBe("15/10");expect(result.excess).toBe(5);
 expect(contractProgress(w,"cobertura",{...period,id:"may",starts_on:"2026-05-01",ends_on:"2026-05-31"}).count).toBe(0);
});
it("separa pendientes, sin periodo, no realizadas y reemplazadas; deduplica por actividad",()=>{
 const w={...emptyAunorWorkspace(),contractPeriods:[period],activities:[activity("one"),activity("one"),activity("pending",{status:"En proceso"}),activity("unassigned",{contract_period_id:null}),activity("cancelled",{not_performed_reason:"Cancelada"}),activity("original"),activity("other",{service_id:"redes"})],
 replacements:[{id:"r",original_activity_id:"original",substitute_activity_id:"one",is_current:true} as never]};
 const result=contractProgress(w,"cobertura",period);expect(result.count).toBe(1);expect(result.pending).toHaveLength(1);expect(result.unassigned).toHaveLength(1);
});
it("no inventa metas ni excluye entregas antiguas de más de 72 horas",()=>{
 const w={...emptyAunorWorkspace(),contractPeriods:[period],activities:[activity("old",{delivered_at:"2026-04-10T12:00:00Z"})]};
 expect(contractProgress(w,"cobertura",{...period,target:null})).toMatchObject({target:null,ratio:"1 / —",count:1,excess:0});
 expect(contractProgress(w,"cobertura")).toMatchObject({target:null,count:0,ratio:"0 / —"});
});
it("cuenta un periodo anual por su identificador y no mezcla meses o servicios",()=>{
 const annual:ContractPeriod={...period,id:"annual",service_id:"resumen-anual",cadence:"annual",starts_on:"2026-04-01",ends_on:"2027-03-31",target:1};
 const w={...emptyAunorWorkspace(),contractPeriods:[annual,period],activities:[activity("annual-work",{service_id:"resumen-anual",contract_period_id:"annual",historical_regularized_at:"2026-09-28T12:00:00Z",delivered_at:null}),activity("monthly-work"),activity("unassigned-annual",{service_id:"resumen-anual",contract_period_id:null})]};
 expect(contractProgress(w,"resumen-anual",annual)).toMatchObject({ratio:"1/1",count:1});
 expect(contractProgress(w,"resumen-anual",annual).unassigned).toHaveLength(1);
});
