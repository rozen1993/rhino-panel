import { beforeEach, describe, expect, it, vi } from "vitest";
import { aunorCommands, canMutateAunor, canUseAunor, emptyAunorWorkspace } from "@/lib/aunor";
import { createAunorExamples } from "@/lib/aunor-examples";
import { roles, roleHome, type Role } from "@/lib/roles";
import { mutateDemoAunor, readDemoAunor } from "@/lib/aunor-demo.server";

const mocks=vi.hoisted(()=>({role:vi.fn(),rpc:vi.fn(),read:vi.fn(),revalidate:vi.fn()}));
vi.mock("next/cache",()=>({revalidatePath:mocks.revalidate}));
vi.mock("@/lib/session",()=>({currentRole:mocks.role}));
vi.mock("@/lib/data-source",()=>({resolveDataSource:()=>"supabase"}));
vi.mock("@/lib/supabase/aunor",()=>({readSupabaseAunor:mocks.read}));
vi.mock("@/lib/supabase/server",()=>({createSupabaseServerClient:async()=>({rpc:mocks.rpc})}));
import { getAunorWorkspaceAction, performAunorAction } from "@/app/aunor/actions";

const actor=(id:Role["id"]):Role=>({...roles[id],accountId:"account-"+id});
const id="00000000-0000-4000-8000-000000000301";
const commandInput=(command:typeof aunorCommands[number])=>({command,activityId:id,requestId:crypto.randomUUID(),payload:{}});
beforeEach(()=>{vi.clearAllMocks();mocks.rpc.mockResolvedValue({error:null});mocks.read.mockResolvedValue(emptyAunorWorkspace());});

describe("Aunor: autorización de acciones y proyección externa",()=>{
  it("solo Admin y Aunor usan el canal y conservan casas distintas",()=>{
    expect(roleHome("aunor")).toBe("/aunor");
    expect(roleHome("admin")).toBe("/actividades");
    expect(canUseAunor(null)).toBe(false);
    for(const id of ["operario","burson"] as const) {
      expect(canUseAunor(actor(id))).toBe(false);
      for(const cmd of aunorCommands)expect(canMutateAunor(actor(id),cmd)).toBe(false);
    }
    for(const cmd of aunorCommands)expect(canMutateAunor({...actor("aunor"),mustChangePassword:true},cmd)).toBe(false);
  });
  it("Admin registra; solo Aunor confirma; ambos conversan",()=>{
    for(const cmd of ["publish","delivery","agreement","replacement"] as const) {
      expect(canMutateAunor(actor("admin"),cmd)).toBe(true);
      expect(canMutateAunor(actor("aunor"),cmd)).toBe(false);
    }
    for(const cmd of ["confirm-delivery","confirm-replacement"] as const) {
      expect(canMutateAunor(actor("admin"),cmd)).toBe(false);
      expect(canMutateAunor(actor("aunor"),cmd)).toBe(true);
    }
  });
  it("rechaza lectura directa antes de consultar la base",async()=>{
    for(const role of [null,actor("operario"),actor("burson"),{...actor("aunor"),mustChangePassword:true}]) {
      mocks.role.mockResolvedValue(role);
      expect((await getAunorWorkspaceAction()).ok).toBe(false);
    }
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("rechaza todos los mutadores externos de Operario y Burson antes del RPC",async()=>{
    for(const name of ["operario","burson"] as const)for(const command of aunorCommands) {
      mocks.role.mockResolvedValue(actor(name));
      expect((await performAunorAction(commandInput(command))).ok).toBe(false);
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("no confía en fuente demo cuando utiliza Supabase",async()=>{
    mocks.role.mockResolvedValue(actor("admin"));
    const input={...commandInput("publish"),payload:{expectedVersion:0,summary:"Público"},demoSource:{id,type:"Grabación" as const,title:"Título adulterado",status:"Entregada" as const,place:"",spans:[],materialLink:"https://example.invalid/forged",version:999,origin:"operario" as const}};
    expect((await performAunorAction(input)).ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("aunor_mutate_v1",{p_command:"publish",p_activity_id:id,p_request_id:input.requestId,p_payload:input.payload});
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("adulterado");
  });
  it("valida identificadores y no revela errores privados del RPC",async()=>{
    mocks.role.mockResolvedValue(actor("aunor"));
    expect((await performAunorAction({...commandInput("message"),activityId:"../cuentas"})).ok).toBe(false);
    expect((await performAunorAction({...commandInput("message"),requestId:"------------------------------------"})).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValue({error:{code:"42501",message:"SECRETO INTERNO"}});
    expect(JSON.stringify(await performAunorAction(commandInput("message")))).not.toContain("SECRETO");
  });
  it("los ejemplos públicos no contienen datos operativos privados ni económicos",()=>{
    const w=createAunorExamples();
    expect(w.activities.some(a=>a.service_id===null)).toBe(true);
    for(const a of w.activities)for(const key of ["operatorOpinion","operator_opinion","description","thread","audit","responsible_id","amount","quantity"]) expect(a).not.toHaveProperty(key);
    expect(w.services.every(s=>Object.keys(s).sort().join(",")==="id,label,position,reference")).toBe(true);
  });
});

describe("simulación externa: objetos y correcciones",()=>{
  it("un comentario no confirma y los reintentos no duplican",()=>{
    const request=crypto.randomUUID(),payload={body:"Mensaje de prueba "+request};
    const first=mutateDemoAunor(actor("aunor"),"message","cobertura-norte",request,payload);
    expect(mutateDemoAunor(actor("aunor"),"message","cobertura-norte",request,payload)).toEqual(first);
    const w=readDemoAunor(actor("aunor"));
    expect(w.messages.filter(m=>m.id===first.id)).toHaveLength(1);
    expect(w.deliveries.find(d=>d.id==="delivery-demo-1")?.confirmed_at).toBeNull();
    expect(()=>mutateDemoAunor(actor("aunor"),"message","cobertura-norte",request,{body:"Otro"})).toThrow();
  });
  it("no confirma otro objeto ni mediante un Admin",()=>{
    const payload={objectId:"delivery-demo-1",version:1,acknowledged:true};
    expect(()=>mutateDemoAunor(actor("admin"),"confirm-delivery","cobertura-norte",crypto.randomUUID(),payload)).toThrow();
    expect(()=>mutateDemoAunor(actor("aunor"),"confirm-delivery","cobertura-norte",crypto.randomUUID(),{...payload,acknowledged:false})).toThrow();
    expect(()=>mutateDemoAunor(actor("aunor"),"confirm-delivery","aunor-senalizacion",crypto.randomUUID(),payload)).toThrow();
  });
  it("conserva el acuerdo original y rechaza correcciones divergentes",()=>{
    const payload={channel:"Llamada",contactedAt:"2026-09-06T12:00:00-05:00",requesterDeclared:"Aunor según llamada",body:"Corrección ficticia",evidenceLink:"",correctsId:"agreement-demo-1"};
    mutateDemoAunor(actor("admin"),"agreement","aunor-original",crypto.randomUUID(),payload);
    const w=readDemoAunor(actor("aunor"));
    expect(w.agreements.find(g=>g.id==="agreement-demo-1")?.is_current).toBe(false);
    expect(w.agreements.some(g=>g.corrects_id==="agreement-demo-1"&&g.is_current)).toBe(true);
    expect(()=>mutateDemoAunor(actor("admin"),"agreement","aunor-original",crypto.randomUUID(),payload)).toThrow();
  });
  it("un payload inválido no aplica cambios parciales",()=>{
    const before=readDemoAunor(actor("aunor"));
    expect(()=>mutateDemoAunor(actor("admin"),"replacement","aunor-original",crypto.randomUUID(),{substituteId:"cobertura-norte",agreementId:"agreement-demo-1",correctsId:"replacement-demo-1",reason:"",evidenceNote:"",evidenceLink:""})).toThrow();
    expect(readDemoAunor(actor("aunor"))).toEqual(before);
  });
});
