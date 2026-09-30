// Audit evidence: intentionally confirms an error after a successful mocked RPC.
import {it,expect,vi} from 'vitest';
import {roles} from '@/lib/roles';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),read:vi.fn(),role:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createSupabaseServerClient:async()=>({rpc:mocks.rpc})}));
vi.mock('@/lib/supabase/session',()=>({currentSupabaseRole:mocks.role}));
vi.mock('@/lib/supabase/activities',()=>({getSupabaseActivity:mocks.read}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
import {advanceSupabaseActivityAction} from '@/app/actividades/actions';
it('REPRO: RPC exitoso seguido de lectura fallida rechaza toda la accion',async()=>{
 const id='00000000-0000-4000-8000-000000000010';
 mocks.role.mockResolvedValue({...roles.operario,accountId:id});
 mocks.rpc.mockResolvedValue({data:[{activity_id:id}],error:null});
 mocks.read.mockRejectedValue(new Error('Lectura posterior interrumpida'));
 await expect(advanceSupabaseActivityAction(id,1)).rejects.toThrow('Lectura posterior interrumpida');
 expect(mocks.rpc).toHaveBeenCalledTimes(1);
});
