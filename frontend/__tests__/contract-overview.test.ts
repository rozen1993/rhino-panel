import {expect,it} from "vitest";
import {createAunorExamples} from "@/lib/aunor-examples";
import {contractOverview,latestContractDelivery} from "@/lib/contract-overview";
import {contractPeriodForMonth} from "@/lib/contract-calendar";
import {contractProgress} from "@/lib/contract-progress";
import {scopeAunorWorkspace} from "@/lib/aunor-read-scope";

it("indexed aggregation matches original calculations, even duplicates, overlaps and missing dates",()=>{
  const w=createAunorExamples();
  for(let i=0;i<400;i++){
    const a={...w.activities[i%4],id:`synthetic-${i}`,service_id:w.services[i%12].id,contract_period_id:i%5===0?"missing":null,delivery_due_on:i%7===0?"2026-05-15":null};
    w.activities.push(a);
    if(i%9!==0)w.journeys.push({activity_id:a.id,position:0,start_date:"2026-04-12",end_date:i%11===0?"2026-05-12":"2026-04-12",place:""});
    if(i%10===0)w.activities.push({...a,title:"Last duplicate wins"});
  }
  const before=JSON.stringify(w);
  for(const month of ["2026-01","2026-03","2026-04","2026-05","2026-12","2027-04"]){
    for(const e of contractOverview(w,month).entries){
      expect(e.period).toEqual(contractPeriodForMonth(w,e.service.id,month));
      expect(e.progress).toEqual(contractProgress(w,e.service.id,e.period));
    }
  }
  expect(JSON.stringify(w)).toBe(before);
});
it("rebuilds indices for refreshed data and never caches another account's snapshot",()=>{
  const w=createAunorExamples();w.activities[0].contract_period_id=null;w.journeys=[{activity_id:w.activities[0].id,position:0,start_date:"2026-04-12",end_date:"2026-04-12",place:""}];
  expect(contractOverview(w,"2026-04").entries[0].progress.count).toBe(1);
  w.activities[0].status="En proceso";
  expect(contractOverview(w,"2026-04").entries[0].progress.count).toBe(0);
  expect(contractOverview({...w,activities:[]},"2026-04").entries[0].progress.count).toBe(0);
});
it("latest delivery uses only current computable deliveries in the chosen period and cadence",()=>{
  const w=createAunorExamples();const a=w.activities[0];
  a.contract_period_id=null;a.delivered_at="2026-10-03T15:00:00Z";
  w.journeys=[{activity_id:a.id,position:0,start_date:"2026-04-12",end_date:"2026-04-12",place:""}];
  expect(latestContractDelivery(contractOverview(w,"2026-04").entries,"monthly")).toMatchObject({id:a.id,deliveredAt:a.delivered_at});
  expect(latestContractDelivery(contractOverview(w,"2026-10").entries,"monthly")).toBeUndefined();
  expect(latestContractDelivery(contractOverview(w,"2026-04").entries,"annual")).toBeUndefined();
  a.delivered_at=null;a.published_at="2026-10-03T16:00:00Z";
  expect(latestContractDelivery(contractOverview(w,"2026-04").entries,"monthly")).toBeUndefined();
});
it("compact contract data preserves every count, reference and date without changing full detail",()=>{
  const w=createAunorExamples(),before=JSON.stringify(w);
  w.activities[0].summary="Long private body ".repeat(1000);
  const compact=scopeAunorWorkspace(w,{scene:"acordado"});
  expect(JSON.stringify(compact).length).toBeLessThan(JSON.stringify(w).length/2);
  expect(compact.activities[0]).toMatchObject({summary:"",material_link:"",place:""});
  expect(compact.activities[0].published_at).toBe(w.activities[0].published_at);
  for(const service of w.services)expect(contractProgress(compact,service.id)).toEqual(contractProgress({...w,activities:compact.activities},service.id));
  expect(scopeAunorWorkspace(w,{scene:"detail",id:w.activities[0].id}).activities[0].summary).toBe(w.activities[0].summary);
  expect(JSON.parse(before).journeys).toEqual(w.journeys);
});
