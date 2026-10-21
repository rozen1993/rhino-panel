type CleanupClient={rpc:(name:string,args?:Record<string,unknown>)=>PromiseLike<{data:unknown;error:unknown}>;storage:{from:(bucket:string)=>{remove:(paths:string[])=>PromiseLike<{error:unknown}>}}};
/** Consumes only paths enqueued by the already authorized permanent erasure. */
export async function cleanErasedSocialPhotos(client:CleanupClient):Promise<boolean>{
 try{
  for(let batch=0;batch<10;batch++){
   const pending=await client.rpc('pending_social_photo_erasure_v1');
   if(pending.error||!Array.isArray(pending.data))return false;
   if(!pending.data.length)return true;
   for(const row of pending.data){
    if(typeof row.id!=='string'||!Array.isArray(row.paths)||row.paths.length!==2||!row.paths.every((path:unknown)=>typeof path==='string'&&/^[a-f0-9-]{36}\/[a-f0-9-]{36}\/(image\.jpg|thumb\.webp)$/.test(path)))return false;
    const removed=await client.storage.from('activity-social-photos').remove(row.paths);
    if(removed.error)return false;
    if((await client.rpc('ack_social_photo_erasure_v1',{p_ids:[row.id]})).error)return false;
   }
  }
  return false;
 }catch{return false;}
}
