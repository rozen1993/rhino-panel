import { beforeEach, expect, it, vi } from "vitest";
import { createAunorExamples } from "@/lib/aunor-examples";
import { scopeAunorWorkspace, type AunorReadScope } from "@/lib/aunor-read-scope";
import type { AunorWorkspace } from "@/lib/aunor";

const mocks=vi.hoisted(()=>({create:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createSupabaseServerClient:mocks.create}));
import { readSupabaseAunor } from "@/lib/supabase/aunor";

const names={activities:"aunor_activities",services:"aunor_services",journeys:"aunor_journeys",deliveries:"aunor_deliveries",agreements:"aunor_agreements",replacements:"aunor_replacements",messages:"aunor_messages",contractPeriods:"aunor_contract_periods"};
let w:AunorWorkspace;
let calls:string[];
let cap:number;
let transferred: Record<string,number>;
let selections: Record<string,string>;
beforeEach(()=>{
  const example=createAunorExamples();
  const ids=new Map<string,string>();let n=1;
  for(const rows of Object.values(example)) for(const row of rows) if("id" in row) ids.set(row.id,`00000000-0000-4000-8000-${String(n++).padStart(12,"0")}`);
  w=JSON.parse(JSON.stringify(example),(_key,value)=>typeof value==="string"?ids.get(value)??value:value);
  w.messages=[];
  w.contractPeriods=[];
  const data=Object.fromEntries(Object.entries(names).map(([key,table])=>[table,w[key as keyof AunorWorkspace]]));
  calls=[];cap=200;transferred={};selections={};
  mocks.create.mockResolvedValue({from:(table:string)=>{
    let rows=[...(data[table] ?? [])] as unknown as Record<string,unknown>[];
    let limit=200;
    const orderColumns:string[]=[];
    const q={
      select:(columns:string,options:{count:string})=>{selections[table]=columns;expect(options.count).toBe("exact");return q;},
      order:(column:string)=>{orderColumns.push(column);return q;},
      limit:(n:number)=>{limit=n;return q;},
      returns:()=>q,
      eq:(column:string,value:unknown)=>{rows=rows.filter(r=>r[column]===value);return q;},
      in:(column:string,values:unknown[])=>{rows=rows.filter(r=>values.includes(r[column]));return q;},
      gt:(column:string,value:string)=>{rows=rows.filter(r=>String(r[column])>value);return q;},
      or:(filter:string)=>{
        if(filter.startsWith("status.neq.Entregada,")){
          const cutoff=filter.split('delivered_at.gt.')[1];
          rows=rows.filter(r=>r.status!=="Entregada" || (typeof r.delivered_at==='string' && Date.parse(r.delivered_at)>Date.parse(cutoff)));
        }else if(filter.startsWith("original_activity_id")){
          const id=filter.split(",")[0].split(".eq.")[1];rows=rows.filter(r=>r.original_activity_id===id||r.substitute_activity_id===id);
        }else{
          const id=filter.split(",")[0].split(".gt.")[1];const position=Number(filter.match(/position.gt.(\d+)/)![1]);
          rows=rows.filter(r=>String(r.activity_id)>id||(r.activity_id===id&&Number(r.position)>position));
        }
        return q;
      },
      then:(resolve:(value:unknown)=>unknown)=>{
        calls.push(table);
        transferred[table]=(transferred[table]??0)+Math.min(rows.length,limit,cap);
        rows.sort((a,b)=>{
          for(const column of orderColumns){
            const left=a[column],right=b[column];
            const comparison=typeof left==="number"&&typeof right==="number"?left-right:String(left).localeCompare(String(right));
            if(comparison)return comparison;
          }
          return 0;
        });
        return Promise.resolve({data:rows.slice(0,Math.min(limit,cap)),count:rows.length,error:null}).then(resolve);
      },
    };return q;
  }});
});
const canonical=(value:AunorWorkspace)=>Object.fromEntries(Object.entries(value).map(([key,rows])=>[key,rows.map(row=>JSON.stringify(row)).sort()]));

it.each(["panel","calendar","acordado","detail","replacement","admin"] as const)("%s conserva exactamente los datos necesarios",async scene=>{
  const scope:AunorReadScope={scene,...(scene==="detail"?{id:w.activities[0].id}:scene==="replacement"?{id:w.replacements[0].id}:{})};
  expect(canonical(await readSupabaseAunor(scope))).toEqual(canonical(scopeAunorWorkspace(w,scope)));
  if(scene==="panel")expect(calls.sort()).toEqual(["aunor_activities","aunor_deliveries","aunor_journeys","aunor_services"]);
  if(scene==="calendar")expect(calls.sort()).toEqual(["aunor_activities","aunor_journeys","aunor_services"]);
  if(scene==="acordado")expect(calls).not.toContain("aunor_agreements");
});
it("mantiene todos los datos con páginas de solo dos filas",async()=>{
  cap=2;
  expect(canonical(await readSupabaseAunor())).toEqual(canonical(w));
  expect(calls.filter(t=>t==="aunor_services")).toHaveLength(Math.ceil(w.services.length/2));
});
it("permite reutilizar solo el catálogo sin consultar servicios",async()=>{
  const result=await readSupabaseAunor({scene:"panel",includeServices:false});
  expect(result.services).toEqual([]);expect(calls).toHaveLength(3);expect(calls).not.toContain("aunor_services");
});
it("un reemplazo inexistente no dispara lecturas relacionadas",async()=>{
  const result=await readSupabaseAunor({scene:"replacement",id:"00000000-0000-4000-8000-999999999999"});
  expect(result.activities).toEqual([]);expect(calls).toEqual(["aunor_replacements"]);
});
it("rechaza identificadores que puedan alterar los filtros antes de crear el cliente",async()=>{
  mocks.create.mockClear();
  await expect(readSupabaseAunor({scene:"detail",id:"id,role.eq.admin"})).rejects.toThrow("Invalid");
  expect(mocks.create).not.toHaveBeenCalled();
});

it("el panel no descarga actividades ni jornadas de entregas fuera de las 72 horas",async()=>{
  const source=w.activities[0];
  for(let i=0;i<500;i++){
    const id=`00000000-0000-4000-9000-${String(i).padStart(12,'0')}`;
    w.activities.push({...source,id,status:'Entregada',delivered_at:'2026-04-10T12:00:00Z'});
    w.journeys.push({activity_id:id,position:0,start_date:'2026-04-10',end_date:'2026-04-10',place:'Ejemplo'});
  }
  const expected=scopeAunorWorkspace(w,{scene:'panel'});
  expect(canonical(await readSupabaseAunor({scene:'panel'}))).toEqual(canonical(expected));
  expect(transferred.aunor_activities).toBe(expected.activities.length);
  expect(transferred.aunor_journeys).toBe(expected.journeys.length);
  expect(calls.filter(c=>c==='aunor_activities')).toHaveLength(1);
});

it("mantiene la paginación cuando hay más de cien actividades vigentes",async()=>{
  const source=w.activities[0];cap=2;
  for(let i=0;i<105;i++){
    const id=`00000000-0000-4000-9000-${String(i).padStart(12,'0')}`;
    w.activities.push({...source,id,status:'Programada'});
    w.journeys.push({activity_id:id,position:0,start_date:'2026-09-30',end_date:'2026-09-30',place:'Ejemplo'});
  }
  expect(canonical(await readSupabaseAunor({scene:'panel'}))).toEqual(canonical(scopeAunorWorkspace(w,{scene:'panel'})));
});

it("contrato solicita solo columnas de resumen y conserva material completo en detalle",async()=>{
  const result=await readSupabaseAunor({scene:"acordado"});
  const columns=selections.aunor_activities.split(",");
  expect(columns).not.toContain("summary");expect(columns).not.toContain("material_link");
  expect(columns).toContain("contract_period_id");expect(columns).toContain("delivered_at");
  expect(result.activities.every(a=>a.summary===""&&a.material_link==="")).toBe(true);
  await readSupabaseAunor({scene:"detail",id:w.activities[0].id});
  expect(selections.aunor_activities.split(",")).toContain("summary");
  expect(selections.aunor_activities.split(",")).toContain("material_link");
});

it("reduce viajes de red cuando el servidor permite páginas mayores, sin truncar",async()=>{
  cap=1000;const base=w.activities[0];
  for(let i=0;i<500;i++)w.activities.push({...base,id:`00000000-0000-4000-9000-${String(i).padStart(12,"0")}`});
  const result=await readSupabaseAunor({scene:"acordado"});
  expect(result.activities).toHaveLength(w.activities.length);
  expect(calls.filter(table=>table==="aunor_activities")).toHaveLength(1);
});
