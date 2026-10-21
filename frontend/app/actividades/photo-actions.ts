'use server';
import {revalidatePath} from 'next/cache';
import {currentSupabaseRole} from '@/lib/supabase/session';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {safeOneDriveFolder,socialFolderError} from '@/lib/social-photos';
import {isUuid} from '@/lib/uuid';

export async function readSocialFolder(activityId:string) {
  const role=await currentSupabaseRole();
  if(!role||role.mustChangePassword||!['admin','operario'].includes(role.id)||!isUuid(activityId))return {ok:false as const,error:'No tienes acceso a esta carpeta.'};
  const db=await createSupabaseServerClient();
  const {data,error}=await db.from('activity_social_folders').select('*').eq('activity_id',activityId).maybeSingle();
  if(error)return {ok:false as const,error:socialFolderError(error.code)};
  return {ok:true as const,folder:data};
}
export async function saveSocialFolder(activityId:string,url:string,version:number) {
  const role=await currentSupabaseRole();
  if(!role||role.mustChangePassword||!['admin','operario'].includes(role.id)||!isUuid(activityId)||!Number.isInteger(version)||version<0)return {ok:false,error:'Solicitud no permitida.'};
  const folder=safeOneDriveFolder(url);
  if(!folder)return {ok:false,error:'Pega un vínculo HTTPS de OneDrive o SharePoint a la carpeta de esta actividad.'};
  const db=await createSupabaseServerClient();
  const {error}=await db.rpc('save_social_folder_v1',{p_activity_id:activityId,p_folder_url:folder,p_expected_version:version});
  if(error)return {ok:false,error:socialFolderError(error.code)};
  revalidatePath('/aunor/fotos');return {ok:true};
}
