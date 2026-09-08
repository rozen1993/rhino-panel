import "server-only";
import type { AunorWorkspace } from "@/lib/aunor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Every selection enumerates the external projection, never internal tables.
async function pages<T>(fetchPage: (from: number, to: number) => PromiseLike<{data: T[] | null; error: unknown}>) {
  const rows: T[] = [];
  for (let page=0;page<250;page++) {
    const {data,error}=await fetchPage(page*200,page*200+199);
    if(error) throw new Error("No se pudo cargar el espacio Aunor. Comprueba que sus migraciones estén instaladas.");
    rows.push(...(data ?? []));
    if(!data || data.length<200) return rows;
  }
  throw new Error("El espacio supera el límite de lectura segura. Contacta al administrador.");
}
export async function readSupabaseAunor(): Promise<AunorWorkspace> {
  const db=await createSupabaseServerClient();
  const [activities,journeys,services,deliveries,agreements,replacements,messages]=await Promise.all([
    pages((a,b)=>db.from("aunor_activities").select("id,type,title,status,place,summary,service_id,not_performed_reason,publication_version,published_at,unread_count").order("id").range(a,b)),
    pages((a,b)=>db.from("aunor_journeys").select("activity_id,position,start_date,end_date,place").order("activity_id").order("position").range(a,b)),
    pages((a,b)=>db.from("aunor_services").select("id,position,label,reference").order("position").range(a,b)),
    pages((a,b)=>db.from("aunor_deliveries").select("id,activity_id,version,material_link,label,published_at,confirmed_at,confirmed_by,is_current").order("id").range(a,b)),
    pages((a,b)=>db.from("aunor_agreements").select("id,activity_id,channel,contacted_at,requester_declared,body,evidence_link,recorded_by,recorded_at,corrects_id,is_current").order("id").range(a,b)),
    pages((a,b)=>db.from("aunor_replacements").select("id,original_activity_id,substitute_activity_id,original_title,substitute_title,agreement_id,reason,evidence_note,evidence_link,recorded_by,recorded_at,corrects_id,confirmed_at,confirmed_by,is_current").order("id").range(a,b)),
    pages((a,b)=>db.from("aunor_messages").select("id,sequence,activity_id,author,author_role,body,created_at,corrects_id,is_own").order("sequence").range(a,b)),
  ]);
  return {activities,journeys,services,deliveries,agreements,replacements,messages};
}
