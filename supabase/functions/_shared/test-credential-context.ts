// Existing handler scenarios focus on Auth and finalization failures.
// Mutex exclusivity/ambiguous failures have their own dedicated tests.
export function withCredentialMutex(ctx: any) {
  const rpc=ctx.supabaseAdmin?.rpc;
  if(rpc) ctx.supabaseAdmin.rpc=(name:string,args:unknown)=> {
    if(name==="begin_credential_operation_v1"||name==="end_credential_operation_v1")return Promise.resolve({error:null});
    return rpc.call(ctx.supabaseAdmin,name,args);
  };
  return ctx;
}
