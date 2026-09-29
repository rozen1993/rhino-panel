"use server";
import { revalidatePath } from "next/cache";
import { currentRole } from "@/lib/session";
import { resolveDataSource } from "@/lib/data-source";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseActivity } from "@/lib/supabase/activities";
import { validCalendarDate } from "@/lib/activity-validation";
import { isUuid } from "@/lib/uuid";
import type { ContractPeriod } from "@/lib/contract-progress";
import { configureDemoContractPeriod, assignDemoContractPeriod } from "@/lib/aunor-demo.server";

export async function configureContractPeriodAction(p:Omit<ContractPeriod,"id"|"version"> & {id?:string;version?:number}) {
  const role=await currentRole();
  if(role?.id!=="admin" || role.mustChangePassword) return {ok:false as const,error:"Solo Admin puede configurar periodos."};
  if(!p || !["monthly","annual"].includes(p.cadence) || !validCalendarDate(p.starts_on) || !validCalendarDate(p.ends_on) || p.starts_on<"2026-01-01" || p.ends_on<p.starts_on ||
    Date.parse(p.ends_on)-Date.parse(p.starts_on)>366*86400000 || (p.cadence==="monthly" && p.starts_on.slice(0,7)!==p.ends_on.slice(0,7)) ||
    (p.target!==null && (!Number.isInteger(p.target) || p.target<1 || p.target>1000000)) || !/^[a-z-]{1,60}$/.test(p.service_id) || (p.id && (!isUuid(p.id) || !Number.isInteger(p.version) || p.version!<1)))
    return {ok:false as const,error:"Revisa las fechas y la meta del periodo contractual."};
  try {
    if(resolveDataSource()==="supabase") {
      const db=await createSupabaseServerClient();
      const {error}=await db.rpc("configure_contract_period_v1",{p_period_id:p.id ?? null,p_expected_version:p.version ?? null,p_service_id:p.service_id,p_cadence:p.cadence,p_starts_on:p.starts_on,p_ends_on:p.ends_on,p_target:p.target});
      if(error) return {ok:false as const,error:error.code==="SR001"?"El periodo cambió. Recarga antes de continuar.":"No se guardó: revisa que el periodo no se superponga y que sus fechas sean válidas."};
    } else configureDemoContractPeriod(role,p);
    revalidatePath("/aunor","layout");
    return {ok:true as const};
  } catch { return {ok:false as const,error:"No se pudo guardar el periodo. Revisa sus datos y vuelve a intentarlo."}; }
}

export async function assignContractPeriodAction(id:string,version:number,publicationVersion:number,periodId:string|null,confirmed:boolean) {
  const role=await currentRole();
  if(role?.id!=="admin" || role.mustChangePassword) return {ok:false as const,error:"Solo Admin puede confirmar periodos."};
  if(confirmed!==true || !Number.isInteger(version) || version<1 || !Number.isInteger(publicationVersion) || publicationVersion<1 || (periodId!==null && !isUuid(periodId))) return {ok:false as const,error:"Confirma el periodo y la publicación vigentes."};
  try {
    if(resolveDataSource()==="supabase") {
      if(!isUuid(id)) return {ok:false as const,error:"Actividad no válida."};
      const db=await createSupabaseServerClient();
      const {error}=await db.rpc("assign_contract_period_v1",{p_activity_id:id,p_expected_version:version,p_publication_version:publicationVersion,p_period_id:periodId,p_confirmed:true});
      if(error) return {ok:false as const,error:error.code==="SR001"?"La actividad o su publicación cambió; recarga la ficha.":"No se guardó el periodo. Debe pertenecer al servicio publicado."};
    } else assignDemoContractPeriod(role,id,publicationVersion,periodId);
    revalidatePath("/aunor","layout"); revalidatePath(`/actividades/${id}`);
    return {ok:true as const,activity:resolveDataSource()==="supabase" ? await getSupabaseActivity(id).catch(()=>null) : null};
  } catch { return {ok:false as const,error:"No se pudo confirmar el periodo."}; }
}
