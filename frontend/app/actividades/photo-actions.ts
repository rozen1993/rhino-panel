'use server';
import {revalidatePath} from 'next/cache';
import {currentSupabaseRole} from '@/lib/supabase/session';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {safeOneDriveFolder,socialFolderError,photoOperationError,type SocialStorageUsage} from '@/lib/social-photos';
import {readSocialPhotos} from '@/lib/supabase/social-photos';
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
export async function listActivityPhotos(activityId:string) {
 const role=await currentSupabaseRole();
 if(!role||role.mustChangePassword||!['admin','operario'].includes(role.id)||!isUuid(activityId))return {ok:false as const,error:'No tienes acceso a estas fotos.'};
 try {
  const db=await createSupabaseServerClient();
  const [photos,usage]=await Promise.all([readSocialPhotos(activityId),db.rpc('social_storage_usage_v1')]);
  if(usage.error)return {ok:false as const,error:photoOperationError(usage.error.code)};
  return {ok:true as const,photos,usage:usage.data as unknown as SocialStorageUsage};
 }catch{return {ok:false as const,error:'No se pudo cargar Social. Comprueba que la configuración esté habilitada y vuelve a intentarlo.'};}
}
export async function archiveActivityPhoto(photoId:string,version:number,archived:boolean) {
 const role=await currentSupabaseRole();
 if(!role||role.mustChangePassword||!['admin','operario'].includes(role.id)||!isUuid(photoId)||!Number.isInteger(version)||version<1||typeof archived!=='boolean')return {ok:false,error:'Solicitud no permitida.'};
 const db=await createSupabaseServerClient();
 const {error}=await db.rpc('set_social_photo_archived_v1',{p_photo_id:photoId,p_expected_version:version,p_archived:archived});
 if(error)return {ok:false,error:photoOperationError(error.code)};
 revalidatePath('/aunor/fotos');return {ok:true};
}
