// @vitest-environment node
import {expect,it} from 'vitest';
import sharp from 'sharp';
import {processSocialPhoto} from '@/lib/social-photo-processing';
import {createPhotoZip} from '@/lib/photo-zip';
import {socialFileError,socialDimensionsError} from '@/lib/social-photo-client';
import {jpegDimensions,webpHasPrivateMetadata} from '../../supabase/functions/_shared/social-photo-validation';
it('valida bytes, orienta y elimina EXIF antes de publicar una copia y su miniatura',async()=>{
 const original=await sharp({create:{width:3000,height:2000,channels:3,background:'#123456'}}).jpeg().withExif({IFD0:{Artist:'Identidad privada',ImageDescription:'No publicar'}}).toBuffer();
 const output=await processSocialPhoto(original);
 const meta=await sharp(output.image).metadata();expect(meta.width).toBe(2048);expect(meta.exif).toBeUndefined();expect(output.image.toString('utf8')).not.toContain('Identidad privada');
 expect(jpegDimensions(output.image)).toEqual({width:2048,height:1365});expect(webpHasPrivateMetadata(output.thumb)).toBe(false);
 expect(jpegDimensions(original)).toBeNull();
 await expect(processSocialPhoto(new TextEncoder().encode('<svg onload="alert(1)"/>'))).rejects.toThrow();
 await expect(processSocialPhoto(new Uint8Array(4*1024*1024+1))).rejects.toThrow();
});
it('genera un ZIP con directorio y tamaños correctos sin compresión adicional',()=>{
 const bytes=new Uint8Array([1,2,3,4]);const zip=createPhotoZip([{name:'album/1.jpg',bytes}]);const view=new DataView(zip.buffer);
 expect(view.getUint32(0,true)).toBe(0x04034b50);expect(view.getUint32(18,true)).toBe(4);
 expect(view.getUint32(zip.length-22,true)).toBe(0x06054b50);expect(view.getUint16(zip.length-12,true)).toBe(1);
 const offset=view.getUint32(zip.length-6,true);expect(view.getUint32(offset,true)).toBe(0x02014b50);
});
it('rechaza fotos pequeñas, vacías o dañadas y limita las copias optimizadas',async()=>{
 await expect(processSocialPhoto(new Uint8Array())).rejects.toThrow();
 await expect(processSocialPhoto(new TextEncoder().encode('JPEG dañado'))).rejects.toThrow();
 const small=await sharp({create:{width:400,height:300,channels:3,background:'#123456'}}).jpeg().toBuffer();
 await expect(processSocialPhoto(small)).rejects.toThrow();
 for(const format of ['png','webp'] as const){
  const original=await sharp({create:{width:1280,height:800,channels:3,background:'#123456'}}).toFormat(format).toBuffer();
  const output=await processSocialPhoto(original);
  expect(output.image.length).toBeLessThanOrEqual(600*1024);
  expect(output.thumb.length).toBeLessThanOrEqual(48*1024);
  expect((await sharp(output.image).metadata()).width).toBe(1280);
 }
});
it('anticipa en el navegador los rechazos de formato, tamaño y resolución',()=>{
 expect(socialFileError({size:4*1024*1024+1,type:'image/jpeg'})).toBeTruthy();
 expect(socialFileError({size:10,type:'image/svg+xml'})).toBeTruthy();
 expect(socialFileError({size:10,type:'image/heic'})).toBeTruthy();
 expect(socialFileError({size:0,type:'image/jpeg'})).toBeTruthy();
 expect(socialFileError({size:100,type:'image/jpeg'})).toBeFalsy();
 expect(socialDimensionsError(400,300)).toBeTruthy();
 expect(socialDimensionsError(7000,6000)).toBeTruthy();
 expect(socialDimensionsError(1280,720)).toBeFalsy();
 expect(socialDimensionsError(720,1280)).toBeFalsy();
});
