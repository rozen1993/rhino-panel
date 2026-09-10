import assert from "node:assert/strict";
import { credentialOperation } from "./credential-operation.ts";

Deno.test("credential mutex rejects a second request while the first Auth write is pending", async () => {
  let owner: string | null = null;
  const ctx = { supabaseAdmin: { async rpc(name: string, args: Record<string,string>) {
    if(name.startsWith("begin")) {
      if(owner) return {error: new Error("busy")};
      owner=args.p_operation_id;
    } else {assert.equal(owner,args.p_operation_id);owner=null;}
    return {error:null};
  } } };
  let finish!: () => void;
  const pending = new Promise<void>(resolve => {finish=resolve;});
  const first=credentialOperation(ctx,"account","actor",async()=>{await pending;return new Response("ok");});
  const second=await credentialOperation(ctx,"account","actor",async()=>{throw Error("must never execute");});
  assert.equal(second.status,409);
  finish();assert.equal((await first).status,200);assert.equal(owner,null);
});
Deno.test("ambiguous external writes retain their lock for reconciliation", async()=>{
  const calls:string[]=[];
  const ctx={supabaseAdmin:{async rpc(name:string){calls.push(name);return {error:null};}}};
  const result=await credentialOperation(ctx,"account","actor",()=>{throw Error("network timeout");});
  assert.equal(result.status,409);
  assert.deepEqual(calls,["begin_credential_operation_v1"]);
});
Deno.test("SDK error results do not release a possibly pending Auth write",async()=>{
  const calls:string[]=[];
  const ctx={supabaseAdmin:{async rpc(name:string){calls.push(name);return {error:null};}}};
  const result=await credentialOperation(ctx,"account","actor",async()=>Response.json({code:"auth_update_failed"},{status:409}));
  assert.equal(result.status,409);
  assert.deepEqual(calls,["begin_credential_operation_v1"]);
});
