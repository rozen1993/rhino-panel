import {createSupabaseServerClient} from '@/lib/supabase/server';
import {currentSupabaseRole} from '@/lib/supabase/session';
import {resolveDataSource} from '@/lib/data-source';
import {SOCIAL_PHOTO_BUCKET} from '@/lib/social-photos';
import {isUuid} from '@/lib/uuid';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
 if(!isUuid(id)||resolveDataSource()!=='supabase')return new Response(null,{status:404,headers});
 const role=await currentSupabaseRole();
 if(!role||role.mustChangePassword)return new Response(null,{status:401,headers});
 const db=await createSupabaseServerClient();
 const {data:photo,error}=await db.from('activity_social_photos').select('*').eq('id',id).maybeSingle();
 if(error||!photo||photo.state!=='ready')return new Response(null,{status:404,headers});
 const variant=new URL(request.url).searchParams.get('variant')??'thumb';
 if(!['thumb','image','download'].includes(variant))return new Response(null,{status:400,headers});
 const thumbnail=variant==='thumb';
 const result=await db.storage.from(SOCIAL_PHOTO_BUCKET).download(`${photo.activity_id}/${photo.id}/${thumbnail?'thumb.webp':'image.jpg'}`);
 if(result.error||!result.data)return new Response(null,{status:404,headers});
 return new Response(result.data,{headers:{...headers,'Content-Type':thumbnail?'image/webp':'image/jpeg',
   'Content-Disposition':`${variant==='download'?'attachment':'inline'}; filename="foto-${photo.id}.${thumbnail?'webp':'jpg'}"`}});
}
