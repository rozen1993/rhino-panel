/** Small ZIP (STORE) writer. JPEGs are already compressed; loaded only on download. */
export function createPhotoZip(files:{name:string;bytes:Uint8Array}[]):Uint8Array {
 const encode=new TextEncoder();
 const crc=(bytes:Uint8Array)=>{let c=0xffffffff;for(const byte of bytes){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
 const parts:Uint8Array[]=[],directory:Uint8Array[]=[];let offset=0,centralSize=0;
 for(const file of files){
   const name=encode.encode(file.name),checksum=crc(file.bytes);
   const header=new Uint8Array(30+name.length),h=new DataView(header.buffer);
   h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);
   h.setUint32(14,checksum,true);h.setUint32(18,file.bytes.length,true);h.setUint32(22,file.bytes.length,true);h.setUint16(26,name.length,true);header.set(name,30);
   parts.push(header,file.bytes);
   const entry=new Uint8Array(46+name.length),d=new DataView(entry.buffer);
   d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);
   d.setUint32(16,checksum,true);d.setUint32(20,file.bytes.length,true);d.setUint32(24,file.bytes.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);entry.set(name,46);
   directory.push(entry);centralSize+=entry.length;offset+=header.length+file.bytes.length;
 }
 const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
 const result=new Uint8Array(offset+centralSize+22);let cursor=0;
 for(const part of [...parts,...directory,end]){result.set(part,cursor);cursor+=part.length;}
 return result;
}
