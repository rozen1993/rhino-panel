import type {Activity} from "./activities";
export const SOCIAL_PHOTO_BUCKET = "activity-social-photos";
export const SOCIAL_PHOTO_MAX_BYTES = 3 * 1024 * 1024;
export type SocialPhoto = {id:string;activity_id:string;caption:string;width:number;height:number;byte_size:number;state:"pending"|"ready";version:number;archived_at:string|null;created_at:string};
export type SocialAlbum = {id:string;title:string;type:Activity["type"];place:string;spans:Activity["spans"];deliveryDueOn?:string|null;photos:SocialPhoto[]};
export function socialPhotoUrl(photo:Pick<SocialPhoto,"id"|"version">, variant:"thumb"|"image"|"download"="thumb") {
  return `/api/fotos/${encodeURIComponent(photo.id)}?variant=${variant}&v=${photo.version}`;
}
export function photoOperationError(code?:string) {
  if(code==='SR013')return 'Esta actividad ya tiene 3 fotos. Retira una antes de añadir otra.';
  if(code==='SR001')return 'Las fotos cambiaron. Actualiza la ficha antes de continuar.';
  if(code==='SR002')return 'No tienes permiso para modificar las fotos de esta actividad.';
  if(code==='PGRST202'||code==='42P01'||code==='PGRST205')return 'Fotos para redes todavía no está habilitado en este servidor.';
  return 'No se pudo guardar la foto. Puedes volver a intentarlo con el mismo archivo.';
}
