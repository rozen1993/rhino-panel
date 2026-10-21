import 'server-only';
import {createSupabaseServerClient} from './server';
import {collectCursorPages} from '@/lib/cursor-pages';
import {type SocialPhoto,type SocialAlbum,photoOperationError} from '@/lib/social-photos';
import {chunkValues,mapWithConcurrency,supabaseBatchConcurrency} from './pagination';

export async function readSocialPhotos(activityId?:string):Promise<SocialPhoto[]> {
 const db=await createSupabaseServerClient();
 return collectCursorPages<SocialPhoto>(last=>{
   let query=db.from('activity_social_photos').select('*',{count:'exact'}).order('id').limit(200);
   if(activityId)query=query.eq('activity_id',activityId);
   else query=query.eq('state','ready').is('archived_at',null);
   if(last)query=query.gt('id',last.id);
   return query.then(result=>{if(result.error)throw new Error(photoOperationError(result.error.code));return result;});
 },photo=>photo.id);
}

export async function readSocialAlbums():Promise<SocialAlbum[]> {
 const photos=await readSocialPhotos();
 const db=await createSupabaseServerClient();
 const batches=chunkValues([...new Set(photos.map(p=>p.activity_id))],100);
 const results=await mapWithConcurrency(batches,supabaseBatchConcurrency,async ids=>{
   const [activities,journeys]=await Promise.all([
     db.from('aunor_activities').select('id,title,type,place,delivery_due_on').in('id',ids),
     collectCursorPages<{activity_id:string;position:number;start_date:string;end_date:string;place:string}>(last=>{
       let q=db.from('aunor_journeys').select('activity_id,position,start_date,end_date,place',{count:'exact'}).in('activity_id',ids).order('activity_id').order('position').limit(1000);
       if(last)q=q.or(`activity_id.gt.${last.activity_id},and(activity_id.eq.${last.activity_id},position.gt.${last.position})`);
       return q;
     },j=>`${j.activity_id}:${j.position}`),
   ]);
   if(activities.error)throw new Error('No se pudieron cargar los álbumes. Vuelve a intentarlo.');
   return (activities.data??[]).map(a=>({id:a.id,title:a.title,type:a.type,place:a.place,deliveryDueOn:a.delivery_due_on,
     spans:journeys.filter(j=>j.activity_id===a.id).map(j=>({start:j.start_date,end:j.end_date,place:j.place})),
     photos:photos.filter(p=>p.activity_id===a.id).sort((a,b)=>a.created_at.localeCompare(b.created_at)),
   }));
 });
 return results.flat();
}
