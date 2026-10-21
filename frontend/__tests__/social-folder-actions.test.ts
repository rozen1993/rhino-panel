import {beforeEach,expect,it,vi} from 'vitest';
import {roles} from '@/lib/roles';
const mocks=vi.hoisted(()=>({role:vi.fn(),rpc:vi.fn(),from:vi.fn(),refresh:vi.fn(),single:vi.fn()}));
vi.mock('next/cache',()=>({revalidatePath:mocks.refresh}));
vi.mock('@/lib/supabase/social-photos',()=>({readSocialPhotos:vi.fn()}));
vi.mock('@/lib/supabase/session',()=>({currentSupabaseRole:mocks.role}));
vi.mock('@/lib/supabase/server',()=>({createSupabaseServerClient:async()=>({rpc:mocks.rpc,from:mocks.from})}));
import {readSocialFolder,saveSocialFolder} from '@/app/actividades/photo-actions';
const activity='00000000-0000-4000-8000-000000000501',url='https://example-my.sharepoint.com/:f:/g/synthetic';
beforeEach(()=>{vi.resetAllMocks();mocks.role.mockResolvedValue(roles.admin);mocks.rpc.mockResolvedValue({error:null});mocks.from.mockReturnValue({select:()=>({eq:()=>({maybeSingle:mocks.single})})});});
it.each([null,roles.aunor,{...roles.admin,mustChangePassword:true}])('denies unauthenticated, client and password-rotation writes',async role=>{
 mocks.role.mockResolvedValue(role);expect((await saveSocialFolder(activity,url,0)).ok).toBe(false);expect(mocks.rpc).not.toHaveBeenCalled();expect((await readSocialFolder(activity)).ok).toBe(false);
});
it('rejects malformed identifiers, version and URLs without a write',async()=>{
 for(const [id,link,version] of [['not-a-uuid',url,0],[activity,'https://evil.example/folder',0],[activity,url,-1]] as const)expect((await saveSocialFolder(id,link,version)).ok).toBe(false);
 expect(mocks.rpc).not.toHaveBeenCalled();
});
it('uses the authorized RPC and invalidates Social only after success',async()=>{
 mocks.role.mockResolvedValue(roles.operario);
 expect(await saveSocialFolder(activity,url,2)).toEqual({ok:true});
 expect(mocks.rpc).toHaveBeenCalledWith('save_social_folder_v1',{p_activity_id:activity,p_folder_url:url,p_expected_version:2});expect(mocks.refresh).toHaveBeenCalledWith('/aunor/fotos');
});
it('reports stale conflicts without leaking provider details or refreshing',async()=>{
 mocks.rpc.mockResolvedValue({error:{code:'SR001',message:'private sensitive trace'}});
 expect(await saveSocialFolder(activity,url,1)).toEqual({ok:false,error:'La carpeta cambió. Actualiza antes de guardar.'});expect(mocks.refresh).not.toHaveBeenCalled();
});
it('reads the safe view, with no author fields in the declared result',async()=>{
 const folder={activity_id:activity,folder_url:url,version:1,updated_at:'2026-10-20'};mocks.single.mockResolvedValue({data:folder,error:null});
 expect(await readSocialFolder(activity)).toEqual({ok:true,folder});expect(mocks.from).toHaveBeenCalledWith('activity_social_folders');
});
