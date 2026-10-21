import type {Activity} from './activities';
export const SOCIAL_PHOTO_BUCKET='activity-social-photos';
export const SOCIAL_INPUT_MAX_BYTES=4*1024*1024;
export const SOCIAL_PHOTO_MAX_BYTES=600*1024;
export const SOCIAL_THUMB_MAX_BYTES=48*1024;
export const SOCIAL_MIN_SHORT_SIDE=720;
export const SOCIAL_MIN_LONG_SIDE=1280;
export type StoredSocialPhoto={id:string;activity_id:string;caption:string;width:number;height:number;byte_size:number;thumb_size:number;state:'pending'|'ready';version:number;archived_at:string|null;created_at:string};
export type SocialPhoto = {id:string;caption:string;previewUrl?:string;version?:number;byte_size?:number};
export type SocialStorageUsage={used_bytes:number;limit_bytes:number;warning:boolean};
export function socialPhotoUrl(photo:SocialPhoto,variant:'thumb'|'image'|'download'='thumb') {
  return photo.previewUrl??`/api/fotos/${encodeURIComponent(photo.id)}?variant=${variant}&v=${photo.version??1}`;
}
export function photoOperationError(code?:string) {
  if(code==='SR013')return 'Esta actividad ya tiene 3 fotos. Retira una del álbum antes de añadir otra.';
  if(code==='SR015')return 'El almacenamiento está cerca de su límite. No se guardó una nueva foto. Contacta con Admin.';
  if(code==='SR001')return 'Las fotos cambiaron. Actualiza el álbum antes de continuar.';
  if(code==='SR002')return 'No tienes permiso para modificar las fotos de esta actividad.';
  if(code==='invalid_photo')return 'La imagen no cumple los requisitos de formato, tamaño o resolución.';
  if(code==='PGRST202'||code==='42P01'||code==='PGRST205')return 'La carga de fotos de Social todavía no está habilitada en este servidor.';
  return 'La carga no se completó. Puedes reintentar con el mismo archivo sin duplicarlo.';
}
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
