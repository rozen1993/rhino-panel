import sharp from 'sharp';
import {SOCIAL_PHOTO_MAX_BYTES} from './social-photos';

/** Decoding validates the file; re-encoding strips EXIF/GPS and private metadata. */
export async function processSocialPhoto(bytes:Uint8Array) {
 if(!bytes.length||bytes.length>4*1024*1024)throw new Error('Usa una foto de hasta 4 MB.');
 const source=sharp(bytes,{limitInputPixels:40_000_000,animated:false,failOn:'error'});
 const metadata=await source.metadata();
 if(!['jpeg','png','webp'].includes(metadata.format??'')||(metadata.pages??1)>1)
   throw new Error('Usa una fotografía JPG, PNG o WebP sin animación.');
 const {data:image,info}=await source.rotate().resize({width:2560,height:2560,fit:'inside',withoutEnlargement:true})
   .flatten({background:'#fff'}).jpeg({quality:90,mozjpeg:true}).toBuffer({resolveWithObject:true});
 if(image.length>SOCIAL_PHOTO_MAX_BYTES)throw new Error('Esta foto es demasiado pesada. Exporta una copia más ligera.');
 const thumb=await sharp(image).resize({width:640,height:480,fit:'inside',withoutEnlargement:true}).webp({quality:76}).toBuffer();
 return {image,thumb,width:info.width,height:info.height};
}
