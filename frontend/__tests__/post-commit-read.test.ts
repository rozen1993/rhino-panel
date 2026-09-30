import {beforeEach,it,expect,vi} from 'vitest';
import {roles} from '@/lib/roles';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),read:vi.fn(),role:vi.fn(),revalidate:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createSupabaseServerClient:async()=>({rpc:mocks.rpc})}));
vi.mock('@/lib/supabase/session',()=>({currentSupabaseRole:mocks.role}));
vi.mock('@/lib/supabase/activities',()=>({getSupabaseActivity:mocks.read}));
vi.mock('next/cache',()=>({revalidatePath:mocks.revalidate}));
import {advanceSupabaseActivityAction} from '@/app/actividades/actions';
const id='00000000-0000-4000-8000-000000000010';
beforeEach(()=>{vi.resetAllMocks();mocks.role.mockResolvedValue({...roles.operario,accountId:id});mocks.rpc.mockResolvedValue({data:[{activity_id:id}],error:null});});
it.each(['exception','missing'])('confirma el guardado aunque la lectura falle: %s',async(mode)=>{
 if(mode==='exception')mocks.read.mockRejectedValue(new Error('Lectura posterior interrumpida'));else mocks.read.mockResolvedValue(null);
 const result=await advanceSupabaseActivityAction(id,1);
 expect(result).toMatchObject({ok:true,activity:null,activityId:id,warning:expect.stringContaining('se guardaron')});
 expect(mocks.rpc).toHaveBeenCalledTimes(1);expect(mocks.revalidate).toHaveBeenCalledWith('/historico');
});
it('conserva el error si la mutación fue rechazada',async()=>{
 mocks.rpc.mockResolvedValue({data:null,error:{code:'SR001'}});
 expect(await advanceSupabaseActivityAction(id,1)).toMatchObject({ok:false,error:expect.stringContaining('cambió')});
 expect(mocks.read).not.toHaveBeenCalled();
});
