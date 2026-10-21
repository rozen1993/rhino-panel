// @vitest-environment node
import {expect,it} from 'vitest';
import sharp from 'sharp';
import {processSocialPhoto} from '@/lib/social-photo-processing';
import {createPhotoZip} from '@/lib/photo-zip';
import {jpegDimensions,webpHasPrivateMetadata} from '../../supabase/functions/_shared/social-photo-validation';
it('valida bytes, orienta y elimina EXIF antes de publicar una copia y su miniatura',async()=>{
 const original=await sharp({create:{width:3000,height:2000,channels:3,background:'#123456'}}).jpeg().withExif({IFD0:{Artist:'Identidad privada',ImageDescription:'No publicar'}}).toBuffer();
 const output=await processSocialPhoto(original);
 const meta=await sharp(output.image).metadata();expect(meta.width).toBe(2560);expect(meta.exif).toBeUndefined();expect(output.image.toString('utf8')).not.toContain('Identidad privada');
 expect(jpegDimensions(output.image)).toEqual({width:2560,height:1707});expect(webpHasPrivateMetadata(output.thumb)).toBe(false);
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
