import {requireRole} from '@/components/mobile-shell';
import {SocialPhotoAlbums} from '@/components/social-photo-albums';
import {readSocialAlbums} from '@/lib/supabase/social-photos';
import {resolveDataSource} from '@/lib/data-source';
import {calendarDateInLima} from '@/lib/historical';
import {socialExamples} from '@/lib/social-examples';
import type {SocialAlbum} from '@/lib/social-photos';
export default async function PhotosPage(){
 await requireRole(r=>r.id==='aunor');
 const demo=resolveDataSource()==='demo';
 let albums:SocialAlbum[]=[],loadError='';
 if(!demo){try{albums=await readSocialAlbums();}catch{loadError='No se pudieron consultar las carpetas reales. Pulsa Actualizar para reintentar. Los ejemplos de presentación siguen disponibles debajo.';}}
 return <main><SocialPhotoAlbums albums={albums} examples={socialExamples} loadError={loadError} today={calendarDateInLima(new Date())}/></main>;
}
