import type {Activity} from './activities';
export type SocialPhoto = {id:string;caption:string;previewUrl:string};
export type SocialAlbum = {id:string;title:string;type:Activity['type'];place:string;spans:Activity['spans'];deliveryDueOn?:string|null;photos:SocialPhoto[];folderUrl?:string|null;sample?:boolean};
export type SocialFolder = {activity_id:string;folder_url:string;version:number;updated_at:string};

/** Navigation only: never fetch sharing links or change Microsoft permissions. */
export function safeOneDriveFolder(value:string):string|null {
  try {
    if(/[\u0000-\u0020\\]/.test(value.trim()))return null;
    const url=new URL(value.trim());
    const host=url.hostname.toLowerCase();
    const allowed=host==='1drv.ms'||host==='onedrive.live.com'||/^[a-z0-9-]+\.sharepoint\.com$/.test(host);
    const hasTarget=url.pathname!=='/'||(host==='onedrive.live.com'&&Boolean(url.searchParams.get('id')||url.searchParams.get('resid')));
    return value.length<=3000&&allowed&&url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&hasTarget?url.href:null;
  } catch {return null;}
}
export function socialFolderError(code?:string) {
  if(code==='SR001')return 'La carpeta cambió. Actualiza antes de guardar.';
  if(code==='SR002')return 'No tienes permiso para vincular esta actividad.';
  if(code==='PGRST202'||code==='42P01'||code==='PGRST205')return 'La configuración de Social todavía no está habilitada en este servidor.';
  return 'No se pudo guardar el vínculo. Vuelve a intentarlo.';
}
