import assert from "node:assert/strict";
import {handleSocialPhotoUpload} from "./index.ts";
import {cleanErasedSocialPhotos} from "../_shared/social-photo-erasure.ts";

const activity="00000000-0000-4000-8000-000000000001";
const photo="00000000-0000-4000-8000-000000000002";
// Header fixtures exercise boundaries without real files or Storage calls.
const jpg=new Uint8Array([255,216,255,192,0,8,8,3,32,5,0,1,255,218,0,2,0,255,217]);
const webp=new Uint8Array([82,73,70,70,22,0,0,0,87,69,66,80,86,80,56,32,10,0,0,0,0,0,0,157,1,42,224,1,104,1]);
function request(image=jpg){
 const body=new FormData();
 body.set("activityId",activity);body.set("caption","Ejemplo sintético");
 body.set("image",new Blob([image],{type:"image/jpeg"}),"image.jpg");
 body.set("thumb",new Blob([webp],{type:"image/webp"}),"thumb.webp");
 return new Request("http://localhost/upload",{method:"POST",body});
}
function context({deny=false,ready=false,duplicate=false,failFinish=false}={}){
 const calls:string[]=[];
 return {calls,ctx:{
   supabase:{rpc:async(name:string)=>{
     calls.push(name);
     if(name==="prepare_social_photo_v1")return deny?{error:{code:"SR002"}}:{data:{id:photo,state:ready?"ready":"pending"}};
     return failFinish?{error:{code:"SR014"}}:{data:null,error:null};
   }},
   supabaseAdmin:{rpc:async(name:string)=>{calls.push(name);return {data:[],error:null};},storage:{from:(bucket:string)=>{
     assert.equal(bucket,"activity-social-photos");
     return {upload:async(path:string,_file:File,options:{upsert:boolean})=>{
       assert.equal(options.upsert,false);calls.push(path);
       return duplicate?{error:{statusCode:"409"}}:{error:null};
     }};
   }}},
 }};
}
Deno.test("upload: caller permission checked before privileged immutable writes",async()=>{
 const {ctx,calls}=context({deny:true});
 assert.equal((await handleSocialPhotoUpload(request(),ctx)).status,409);
 assert.deepEqual(calls,["prepare_social_photo_v1"]);
});
Deno.test("upload: metadata ready is idempotent and pending retry tolerates existing objects",async()=>{
 const ready=context({ready:true});
 assert.equal((await handleSocialPhotoUpload(request(),ready.ctx)).status,200);
 assert.deepEqual(ready.calls,["prepare_social_photo_v1"]);
 const pending=context({duplicate:true});
 assert.equal((await handleSocialPhotoUpload(request(),pending.ctx)).status,201);
 assert.deepEqual(pending.calls,["prepare_social_photo_v1",`${activity}/${photo}/image.jpg`,`${activity}/${photo}/thumb.webp`,"finish_social_photo_v1"]);
});
Deno.test("upload: malformed bytes, metadata, oversized streams and missing objects rejected",async()=>{
 const {ctx,calls}=context();
 assert.equal((await handleSocialPhotoUpload(request(new Uint8Array([1,2,3])),ctx)).status,400);
 const exif=new Uint8Array([...jpg.slice(0,2),255,225,0,4,1,1,...jpg.slice(2)]);
 assert.equal((await handleSocialPhotoUpload(request(exif),ctx)).status,400);
 assert.equal((await handleSocialPhotoUpload(new Request("http://localhost",{method:"POST",body:new Uint8Array(4*1024*1024)}),ctx)).status,413);
 assert.deepEqual(calls,[]);
 const incomplete=context({failFinish:true});
 assert.equal((await handleSocialPhotoUpload(request(),incomplete.ctx)).status,409);
 assert.ok(incomplete.calls.includes("queue_erased_social_photo_upload_v1"));
});
Deno.test("erasure: acknowledge only after successful private object removal",async()=>{
 let ack=false,removed=false,failRemoval=false;
 const client={
   rpc:async(name:string)=>{
     if(name==="ack_social_photo_erasure_v1"){assert.equal(removed,true);ack=true;return {data:null,error:null};}
     return {data:ack?[]:[{id:photo,paths:[`${activity}/${photo}/image.jpg`,`${activity}/${photo}/thumb.webp`]}],error:null};
   },
   storage:{from:()=>({remove:async()=>{removed=true;return {error:failRemoval?new Error("retry"):null};}})},
 };
 assert.equal(await cleanErasedSocialPhotos(client),true);
 assert.equal(ack,true);
 ack=false;
 failRemoval=true;
 assert.equal(await cleanErasedSocialPhotos(client),false);
 assert.equal(ack,false);
});
