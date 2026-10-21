import {withSupabase} from "npm:@supabase/server@1.4.1";
import {response} from "../_shared/account-validation.ts";
import {jpegDimensions,webpHasPrivateMetadata,webpDimensions} from "../_shared/social-photo-validation.ts";
import {cleanErasedSocialPhotos} from "../_shared/social-photo-erasure.ts";
const bucket='activity-social-photos';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export async function handleSocialPhotoUpload(request:Request,ctx:any) {
 if(request.method!=='POST')return response({code:'method_not_allowed'},405);
 // Bound the stream even when called directly, without the frontend proxy.
 const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
 if(!reader)return response({code:'invalid_photo'},400);
 while(true){
   const part=await reader.read();if(part.done)break;
   size+=part.value.byteLength;
   if(size>614400+49152+65536){await reader.cancel();return response({code:'invalid_photo'},413);}
   chunks.push(part.value);
 }
 const payload=new Uint8Array(size);let offset=0;
 for(const chunk of chunks){payload.set(chunk,offset);offset+=chunk.byteLength;}
 const form=await new Response(payload,{headers:{'Content-Type':request.headers.get('Content-Type')??''}}).formData().catch(()=>null);
 const image=form?.get('image'),thumb=form?.get('thumb'),activity=form?.get('activityId'),caption=form?.get('caption');
 if(!(image instanceof File)||!(thumb instanceof File)||image.type!=='image/jpeg'||thumb.type!=='image/webp'||
 image.size>614400||thumb.size>49152||typeof activity!=='string'||!uuid.test(activity)||typeof caption!=='string'||caption.trim().length<1||caption.length>160)
 return response({code:'invalid_photo'},400);
 const bytes=new Uint8Array(await image.arrayBuffer()),thumbnail=new Uint8Array(await thumb.arrayBuffer());
 const dimensions=jpegDimensions(bytes);
 const small=webpDimensions(thumbnail);
 if(!dimensions||Math.max(dimensions.width,dimensions.height)>2048||Math.max(dimensions.width,dimensions.height)<1280||Math.min(dimensions.width,dimensions.height)<720||webpHasPrivateMetadata(thumbnail)||!small||Math.max(small.width,small.height)>480)return response({code:'invalid_photo'},400);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 const prepared=await ctx.supabase.rpc('prepare_social_photo_v1',{
   p_activity_id:activity,p_photo_id:crypto.randomUUID(),p_digest:digest,p_caption:caption.trim(),
   p_width:dimensions.width,p_height:dimensions.height,p_byte_size:image.size,p_thumb_size:thumb.size,
 });
 if(prepared.error)return response({code:prepared.error.code},409);
 const photo=prepared.data;
 if(!photo||typeof photo.id!=='string'||!uuid.test(photo.id))return response({code:'prepare_failed'},503);
 if(photo.state==='ready')return response({ok:true,id:photo.id});
 async function compensateErasedUpload(){
   try{
     const queued=await ctx.supabaseAdmin.rpc('queue_erased_social_photo_upload_v1',{p_activity_id:activity,p_photo_id:photo.id});
     if(!queued.error)await cleanErasedSocialPhotos(ctx.supabaseAdmin);
   }catch{/* Leave the erasure queue for a later retry; never remove a live reservation. */}
 }
 try{
 for(const [name,file] of [['image.jpg',image],['thumb.webp',thumb]] as const){
   const path=`${activity}/${photo.id}/${name}`;
   // Service-managed objects have no user owner. Never overwrite an object.
   const uploaded=await ctx.supabaseAdmin.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false,cacheControl:'0'});
   if(uploaded.error && !['409','Duplicate'].includes(String(uploaded.error.statusCode??uploaded.error.error))){
     await compensateErasedUpload();
     return response({code:'upload_incomplete'},503);
   }
 }
 const finished=await ctx.supabase.rpc('finish_social_photo_v1',{p_photo_id:photo.id});
 if(finished.error){await compensateErasedUpload();return response({code:finished.error.code},409);}
 return response({ok:true,id:photo.id},201);
 }catch{await compensateErasedUpload();return response({code:'upload_incomplete'},503);}
}
export default {fetch:withSupabase({auth:'user'},handleSocialPhotoUpload)};
