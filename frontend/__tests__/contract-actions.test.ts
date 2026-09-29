import {beforeEach,expect,it,vi} from "vitest";
import {roles} from "@/lib/roles";
const mocks=vi.hoisted(()=>({role:vi.fn(),rpc:vi.fn()}));
vi.mock("@/lib/session",()=>({currentRole:mocks.role}));
vi.mock("@/lib/data-source",()=>({resolveDataSource:()=>"supabase"}));
vi.mock("@/lib/supabase/server",()=>({createSupabaseServerClient:async()=>({rpc:mocks.rpc})}));
vi.mock("@/lib/supabase/activities",()=>({getSupabaseActivity:vi.fn().mockResolvedValue(null)}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
import {assignContractPeriodAction,configureContractPeriodAction} from "@/app/aunor/contract-actions";
const id="00000000-0000-4000-8000-000000000010";
const period={service_id:"cobertura",cadence:"monthly" as const,starts_on:"2026-04-01",ends_on:"2026-04-30",target:10};
beforeEach(()=>{vi.clearAllMocks();mocks.rpc.mockResolvedValue({error:null});mocks.role.mockResolvedValue(roles.admin);});
it("rechaza cliente, operario y contraseña pendiente antes de consultar la base",async()=>{
 for(const role of [roles.aunor,roles.operario,null,{...roles.admin,mustChangePassword:true}]){
   mocks.role.mockResolvedValue(role);
   expect((await configureContractPeriodAction(period)).ok).toBe(false);
   expect((await assignContractPeriodAction(id,1,1,id,true)).ok).toBe(false);
 }
 expect(mocks.rpc).not.toHaveBeenCalled();
});
it("conserva una meta desconocida como null y exige fechas válidas",async()=>{
 expect((await configureContractPeriodAction({...period,target:null})).ok).toBe(true);
 expect(mocks.rpc).toHaveBeenCalledWith("configure_contract_period_v1",expect.objectContaining({p_target:null,p_starts_on:"2026-04-01",p_ends_on:"2026-04-30"}));
 mocks.rpc.mockClear();
 for(const patch of [{ends_on:"2026-05-01"},{target:0},{target:1.5},{starts_on:"2026-02-30"}])expect((await configureContractPeriodAction({...period,...patch})).ok).toBe(false);
 expect(mocks.rpc).not.toHaveBeenCalled();
});
it("requiere confirmación booleana explícita y versiones del trabajo y publicación",async()=>{
 expect((await assignContractPeriodAction(id,1,1,id,false)).ok).toBe(false);
 expect((await assignContractPeriodAction(id,1,1,id,"true" as never)).ok).toBe(false);
 expect((await assignContractPeriodAction(id,1,0,id,true)).ok).toBe(false);
 expect(mocks.rpc).not.toHaveBeenCalled();
 expect((await assignContractPeriodAction(id,2,3,id,true)).ok).toBe(true);
 expect(mocks.rpc).toHaveBeenCalledWith("assign_contract_period_v1",{p_activity_id:id,p_expected_version:2,p_publication_version:3,p_period_id:id,p_confirmed:true});
});
