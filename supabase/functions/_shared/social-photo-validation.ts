/** Accept only decoded/re-encoded JPEGs, without EXIF, GPS, XMP or comments. */
export function jpegDimensions(bytes:Uint8Array):{width:number;height:number}|null {
 if(bytes.length<4||bytes[0]!==255||bytes[1]!==216)return null;
 let offset=2,dimensions:null|{width:number;height:number}=null;
 let scanned=false;
 while(offset+2<=bytes.length){
   if(bytes[offset]!==255)return null;
   while(bytes[offset+1]===255)offset++;
   const marker=bytes[offset+1];offset+=2;
   if(marker===0xd9)return scanned&&offset===bytes.length?dimensions:null;
   if(offset+2>bytes.length)return null;
   const length=(bytes[offset]<<8)|bytes[offset+1];
   if(length<2||offset+length>bytes.length)return null;
   if((marker>=0xe1&&marker<=0xef)||marker===0xfe)return null;
   if([0xc0,0xc1,0xc2].includes(marker)){
     if(length<8)return null;
     dimensions={height:(bytes[offset+3]<<8)|bytes[offset+4],width:(bytes[offset+5]<<8)|bytes[offset+6]};
     if(!dimensions.width||!dimensions.height)return null;
   }
   offset+=length;
   if(marker===0xda){
     scanned=true;
     // Entropy data can contain stuffed FF00 and restart markers, but all
     // later marker segments still need inspection (including progressive JPEG).
     while(offset<bytes.length){
       if(bytes[offset]!==255){offset++;continue;}
       if(bytes[offset+1]===0 || (bytes[offset+1]>=0xd0&&bytes[offset+1]<=0xd7)){offset+=2;continue;}
       break;
     }
   }
 }
 return null;
}
export function webpHasPrivateMetadata(bytes:Uint8Array):boolean {
 const text=(offset:number,n:number)=>String.fromCharCode(...bytes.subarray(offset,offset+n));
 if(bytes.length<20||text(0,4)!=='RIFF'||text(8,4)!=='WEBP')return true;
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(view.getUint32(4,true)+8!==bytes.length)return true;
 let offset=12,hasImage=false;
 while(offset+8<=bytes.length){
   const type=text(offset,4),length=view.getUint32(offset+4,true);
   if(!['VP8 ','VP8L','VP8X','ALPH'].includes(type)||offset+8+length>bytes.length)return true;
   if(type==='VP8 '||type==='VP8L')hasImage=true;
   offset+=8+length+(length%2);
 }
 return !hasImage||offset!==bytes.length;
}
