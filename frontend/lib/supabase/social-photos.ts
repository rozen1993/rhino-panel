import 'server-only';
import {createSupabaseServerClient} from './server';
import {collectCursorPages} from '@/lib/cursor-pages';
import {type SocialFolder,type SocialAlbum,socialFolderError} from '@/lib/social-photos';
import {chunkValues,mapWithConcurrency,supabaseBatchConcurrency} from './pagination';

export async function readSocialAlbums():Promise<SocialAlbum[]> {
  const db=await createSupabaseServerClient();
  const folders=await collectCursorPages<SocialFolder>(last=>{
    let q=db.from('activity_social_folders').select('*',{count:'exact'}).order('activity_id').limit(200);
    if(last)q=q.gt('activity_id',last.activity_id);
    return q.then(result=>{if(result.error)throw new Error(socialFolderError(result.error.code));return result;});
  },folder=>folder.activity_id);
  const batches=chunkValues(folders.map(f=>f.activity_id),100);
  const results=await mapWithConcurrency(batches,supabaseBatchConcurrency,async ids=>{
    const [activities,journeys]=await Promise.all([
      collectCursorPages<{id:string;title:string;type:SocialAlbum['type'];place:string;delivery_due_on?:string|null}>(last=>{
        let q=db.from('aunor_activities').select('id,title,type,place,delivery_due_on',{count:'exact'}).in('id',ids).order('id').limit(100);
        if(last)q=q.gt('id',last.id);
        return q;
      },a=>a.id),
      collectCursorPages<{activity_id:string;position:number;start_date:string;end_date:string;place:string}>(last=>{
        let q=db.from('aunor_journeys').select('activity_id,position,start_date,end_date,place',{count:'exact'}).in('activity_id',ids).order('activity_id').order('position').limit(1000);
        if(last)q=q.or(`activity_id.gt.${last.activity_id},and(activity_id.eq.${last.activity_id},position.gt.${last.position})`);
        return q;
      },j=>`${j.activity_id}:${j.position}`),
    ]);
    return activities.map(a=>({id:a.id,title:a.title,type:a.type,place:a.place,deliveryDueOn:a.delivery_due_on,
      spans:journeys.filter(j=>j.activity_id===a.id).map(j=>({start:j.start_date,end:j.end_date,place:j.place})),
      photos:[],folderUrl:folders.find(f=>f.activity_id===a.id)?.folder_url??null,
    }));
  });
  return results.flat();
}
