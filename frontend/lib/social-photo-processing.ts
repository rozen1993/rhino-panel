import sharp from 'sharp';
import {SOCIAL_INPUT_MAX_BYTES,SOCIAL_PHOTO_MAX_BYTES,SOCIAL_THUMB_MAX_BYTES,SOCIAL_MIN_SHORT_SIDE,SOCIAL_MIN_LONG_SIDE} from './social-photos';
export class SocialPhotoValidationError extends Error {}

/** Decode before acceptance; re-encode without EXIF/GPS, never store original. */
export async function processSocialPhoto(bytes:Uint8Array) {
 if(!bytes.length)throw new SocialPhotoValidationError('El archivo está vacío. Elige una fotografía.');
 if(bytes.length>SOCIAL_INPUT_MAX_BYTES)throw new SocialPhotoValidationError('La foto supera 4 MB. Exporta una copia más ligera y conserva el original en OneDrive.');
 try {
  const source=sharp(bytes,{limitInputPixels:40_000_000,animated:false,failOn:'error'}),metadata=await source.metadata();
  if(!['jpeg','png','webp'].includes(metadata.format??'')||(metadata.pages??1)>1)throw new SocialPhotoValidationError('Usa JPG, PNG o WebP sin animación. Otros formatos no están admitidos.');
  if(Math.min(metadata.width??0,metadata.height??0)<SOCIAL_MIN_SHORT_SIDE||Math.max(metadata.width??0,metadata.height??0)<SOCIAL_MIN_LONG_SIDE)throw new SocialPhotoValidationError('La resolución es insuficiente: necesitas al menos 1280 × 720 píxeles, en horizontal o vertical.');
  // Maintain quality >= 82; reduce dimensions modestly, not quality indefinitely.
  let result:Awaited<ReturnType<typeof encode>>|undefined;
  async function encode(edge:number,quality:number){return source.clone().rotate().resize({width:edge,height:edge,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality,mozjpeg:true}).toBuffer({resolveWithObject:true});}
  for(const [edge,quality] of [[2048,88],[2048,82],[1800,82],[1600,82]] as const){
    const attempt=await encode(edge,quality);
    if(attempt.data.length<=SOCIAL_PHOTO_MAX_BYTES&&Math.min(attempt.info.width,attempt.info.height)>=SOCIAL_MIN_SHORT_SIDE){result=attempt;break;}
  }
  if(!result)throw new SocialPhotoValidationError('Esta foto no puede reducirse a 600 KB conservando la calidad mínima. Exporta otra copia para redes.');
  let thumb=await sharp(result.data).resize({width:480,height:360,fit:'inside',withoutEnlargement:true}).webp({quality:72}).toBuffer();
  if(thumb.length>SOCIAL_THUMB_MAX_BYTES)thumb=await sharp(result.data).resize({width:360,height:270,fit:'inside',withoutEnlargement:true}).webp({quality:65}).toBuffer();
  if(thumb.length>SOCIAL_THUMB_MAX_BYTES)throw new SocialPhotoValidationError('No se pudo preparar una miniatura ligera. Prueba con otra fotografía.');
  return {image:result.data,thumb,width:result.info.width,height:result.info.height};
 } catch(error) {
   if(error instanceof SocialPhotoValidationError)throw error;
   throw new SocialPhotoValidationError('No se pudo leer la foto: puede estar dañada o superar 40 megapíxeles. Usa JPG, PNG o WebP válido.');
 }
}
