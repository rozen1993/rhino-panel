import {requireRole} from '@/components/mobile-shell';
import {SocialPhotoAlbums} from '@/components/social-photo-albums';
import {readSocialAlbums} from '@/lib/supabase/social-photos';
import {resolveDataSource} from '@/lib/data-source';
import {calendarDateInLima} from '@/lib/historical';
export default async function PhotosPage(){
 await requireRole(r=>r.id==='aunor');
 const demo=resolveDataSource()==='demo';
 const albums=demo?[]:await readSocialAlbums();
 return <main>{demo&&<p className="mx-6 mt-5 rounded-md border border-cyan/30 bg-cyan/5 p-3 text-sm">Demostración aislada. Los álbumes reales aparecerán al conectar el almacenamiento.</p>}<SocialPhotoAlbums albums={albums} today={calendarDateInLima(new Date())}/></main>;
}
