import {expect,it} from "vitest";
import {createAunorExamples} from "@/lib/aunor-examples";
import {contractOverview} from "@/lib/contract-overview";
import {contractPeriodForMonth} from "@/lib/contract-calendar";
import {contractProgress} from "@/lib/contract-progress";

it("benchmarks equivalent contract calculations with 2400 synthetic activities",()=>{
  const w=createAunorExamples(),base=w.activities[0];w.activities=[];w.journeys=[];w.replacements=[];
  for(let i=0;i<2400;i++){
    const id=`synthetic-benchmark-${i}`;
    w.activities.push({...base,id,service_id:w.services[i%12].id,contract_period_id:null});
    w.journeys.push({activity_id:id,position:0,start_date:"2026-04-12",end_date:"2026-04-12",place:""});
  }
  const old=()=>w.services.map(s=>contractProgress(w,s.id,contractPeriodForMonth(w,s.id,"2026-04")));
  const indexed=()=>contractOverview(w,"2026-04").entries.map(e=>e.progress);
  expect(indexed()).toEqual(old());
  const sample=(fn:()=>unknown)=>{const runs=[];for(let n=0;n<5;n++){const t=performance.now();fn();runs.push(performance.now()-t);}return runs.sort((a,b)=>a-b)[2];};
  const baseline=sample(old),optimized=sample(indexed);
  console.log(JSON.stringify({benchmark:"contract-compute-only",activities:2400,medianOf:5,baselineMs:+baseline.toFixed(2),indexedMs:+optimized.toFixed(2)}));
  // Timing is evidence, not a flaky CI threshold or a network-performance claim.
});
