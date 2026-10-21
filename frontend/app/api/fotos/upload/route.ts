import {currentSupabaseRole} from '@/lib/supabase/session';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {resolveDataSource} from '@/lib/data-source';
import {isUuid} from '@/lib/uuid';
import {processSocialPhoto,SocialPhotoValidationError} from '@/lib/social-photo-processing';
import {revalidatePath} from 'next/cache';
import {photoOperationError} from '@/lib/social-photos';
export const runtime='nodejs';
const fail=(error:string,status=400)=>Response.json({ok:false,error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request) {
 if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Solicitud no permitida.',403);
 if(resolveDataSource()!=='supabase')return fail('La carga real de fotos requiere el servidor de la plataforma.',409);
 const role=await currentSupabaseRole();
 if(!role||role.mustChangePassword||!['admin','operario'].includes(role.id))return fail('Inicia sesión con una cuenta autorizada.',403);
 const reader=request.body?.getReader();if(!reader)return fail('Falta la fotografía.');
 const chunks:Uint8Array[]=[];let size=0;
 for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>4*1024*1024+65536){await reader.cancel();return fail('Usa una foto de hasta 4 MB.',413);}chunks.push(value);}
 const buffer=new Uint8Array(size);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
 const form=await new Response(buffer,{headers:{'Content-Type':request.headers.get('content-type')??''}}).formData().catch(()=>null);
 const file=form?.get('file'),activityId=form?.get('activityId'),caption=form?.get('caption');
 if(!(file instanceof File)||typeof activityId!=='string'||!isUuid(activityId)||typeof caption!=='string'||!caption.trim()||caption.length>160)return fail('Selecciona una foto y escribe una descripción breve.');
 const db=await createSupabaseServerClient();
 const {data:activity,error:activityError}=await db.from('activities').select('responsible_id,deleted_at').eq('id',activityId).maybeSingle();
 if(activityError||!activity||activity.deleted_at||(role.id==='operario'&&activity.responsible_id!==role.accountId))return fail('No tienes permiso para añadir fotos a esta actividad.',403);
 let processed;
 try{processed=await processSocialPhoto(new Uint8Array(await file.arrayBuffer()));}catch(error){return fail(error instanceof SocialPhotoValidationError?error.message:'No se pudo preparar la foto. Vuelve a intentarlo.');}
 const payload=new FormData();payload.set('activityId',activityId);payload.set('caption',caption.trim());
 payload.set('image',new Blob([new Uint8Array(processed.image)],{type:'image/jpeg'}),'image.jpg');
 payload.set('thumb',new Blob([new Uint8Array(processed.thumb)],{type:'image/webp'}),'thumb.webp');
 const result=await db.functions.invoke('social-photo-upload',{body:payload});
 if(result.error){let code='';try{code=(await result.error.context?.json())?.code??'';}catch{}return fail(photoOperationError(code),503);}
 if(!result.data?.ok)return fail(photoOperationError(result.data?.code),409);
 revalidatePath('/aunor/fotos');
 return Response.json({ok:true,id:result.data.id,bytes:processed.image.length,width:processed.width,height:processed.height},{headers:{'Cache-Control':'no-store'}});
}
