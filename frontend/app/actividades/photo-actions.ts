'use server';
import {revalidatePath} from 'next/cache';
import {currentSupabaseRole} from '@/lib/supabase/session';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {readSocialPhotos} from '@/lib/supabase/social-photos';
import {photoOperationError} from '@/lib/social-photos';
import {isUuid} from '@/lib/uuid';

export async function listActivityPhotos(activityId:string) {
 const role=await currentSupabaseRole();
 if(!role||role.mustChangePassword||!['admin','operario'].includes(role.id)||!isUuid(activityId))return {ok:false as const,error:'No tienes acceso a estas fotos.'};
 try{return {ok:true as const,photos:await readSocialPhotos(activityId)};}catch(error){return {ok:false as const,error:error instanceof Error?error.message:'No se pudieron cargar las fotos.'};}
}
export async function archiveActivityPhoto(photoId:string,version:number,archived:boolean) {
 const role=await currentSupabaseRole();
 if(!role||role.mustChangePassword||!['admin','operario'].includes(role.id)||!isUuid(photoId)||!Number.isInteger(version)||version<1||typeof archived!=='boolean')return {ok:false,error:'Solicitud no permitida.'};
 const db=await createSupabaseServerClient();
 const {error}=await db.rpc('set_social_photo_archived_v1',{p_photo_id:photoId,p_expected_version:version,p_archived:archived});
 if(error)return {ok:false,error:photoOperationError(error.code)};
 revalidatePath('/aunor/fotos');return {ok:true};
}
