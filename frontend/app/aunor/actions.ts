"use server";
import { revalidatePath } from "next/cache";
import { currentRole } from "@/lib/session";
import { resolveDataSource } from "@/lib/data-source";
import { aunorCommands, canUseAunor, canMutateAunor, type AunorCommand } from "@/lib/aunor";
import { readSupabaseAunor } from "@/lib/supabase/aunor";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readDemoAunor, mutateDemoAunor, type DemoAunorSource } from "@/lib/aunor-demo.server";
import type { Json } from "@/lib/supabase/database.types";

export async function getAunorWorkspaceAction() {
  const role=await currentRole();
  if(!canUseAunor(role)) return {ok:false as const,error:"No tienes acceso al espacio Aunor."};
  try { return {ok:true as const,data:resolveDataSource()==="supabase"?await readSupabaseAunor():readDemoAunor(role)}; }
  catch { return {ok:false as const,error:"No se pudo cargar Aunor. Verifica la conexión y sus migraciones."}; }
}
export async function performAunorAction(input:{
  command:AunorCommand;activityId:string;requestId:string;payload:Record<string,Json>;demoSource?:DemoAunorSource;
}) {
  const role=await currentRole();
  if(!input || !aunorCommands.includes(input.command) || !canMutateAunor(role,input.command))
    return {ok:false as const,error:"No tienes permiso para esta acción."};
  if(typeof input.activityId!=="string" || !/^[a-z0-9-]{1,100}$/i.test(input.activityId) || typeof input.requestId!=="string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.requestId) ||
    !input.payload || typeof input.payload!=="object" || Array.isArray(input.payload) || JSON.stringify(input.payload).length>32000)
    return {ok:false as const,error:"Los datos de la acción no son válidos."};
  try {
    if(resolveDataSource()==="supabase") {
      if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.activityId))
        return {ok:false as const,error:"Actividad no disponible."};
      const db=await createSupabaseServerClient();
      const {error}=await db.rpc("aunor_mutate_v1",{p_command:input.command,p_activity_id:input.activityId,p_request_id:input.requestId,p_payload:input.payload});
      if(error) return {ok:false as const,error:error.code==="SR001"?"La información cambió. Recarga y revisa el objeto vigente.":error.code==="SR002"?"No tienes acceso a esta actividad o acción.":error.code==="SR006"?"El reintento no coincide con la acción original.":"No se pudo guardar. Revisa los campos y la disponibilidad de Aunor."};
    } else {
      mutateDemoAunor(role!,input.command,input.activityId,input.requestId,input.payload,input.demoSource);
    }
    revalidatePath("/aunor","layout");
    revalidatePath("/actividades/"+encodeURIComponent(input.activityId));
    return {ok:true as const};
  } catch {
    return {ok:false as const,error:"No se pudo guardar. Revisa la actividad y vuelve a intentarlo."};
  }
}
