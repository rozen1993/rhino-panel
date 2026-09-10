import "server-only";
import type { AunorWorkspace } from "@/lib/aunor";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { collectCursorPages } from "@/lib/cursor-pages";

export async function readSupabaseAunor(): Promise<AunorWorkspace> {
  const db = await createSupabaseServerClient();
  const [activities,services,deliveries,agreements,replacements,journeys] = await Promise.all([
    collectCursorPages<AunorWorkspace["activities"][number]>(last => {
      let query = db.from("aunor_activities").select("id,type,title,status,place,summary,service_id,not_performed_reason,publication_version,published_at,unread_count").order("id").limit(200);
      if(last) query = query.gt("id", last.id);
      return query;
    }, row => row.id),
    collectCursorPages<AunorWorkspace["services"][number]>(last => {
      let query = db.from("aunor_services").select("id,position,label,reference").order("id").limit(200);
      if(last) query = query.gt("id", last.id);
      return query;
    }, row => row.id),
    collectCursorPages<AunorWorkspace["deliveries"][number]>(last => {
      let query = db.from("aunor_deliveries").select("id,activity_id,version,material_link,label,published_at,confirmed_at,confirmed_by,is_current").order("id").limit(200);
      if(last) query = query.gt("id", last.id);
      return query;
    }, row => row.id),
    collectCursorPages<AunorWorkspace["agreements"][number]>(last => {
      let query = db.from("aunor_agreements").select("id,activity_id,channel,contacted_at,requester_declared,body,evidence_link,recorded_by,recorded_at,corrects_id,is_current").order("id").limit(200);
      if(last) query = query.gt("id", last.id);
      return query;
    }, row => row.id),
    collectCursorPages<AunorWorkspace["replacements"][number]>(last => {
      let query = db.from("aunor_replacements").select("id,original_activity_id,substitute_activity_id,original_title,substitute_title,agreement_id,reason,evidence_note,evidence_link,recorded_by,recorded_at,corrects_id,confirmed_at,confirmed_by,is_current").order("id").limit(200);
      if(last) query = query.gt("id", last.id);
      return query;
    }, row => row.id),
    collectCursorPages<AunorWorkspace["journeys"][number]>(last => {
      let query = db.from("aunor_journeys").select("activity_id,position,start_date,end_date,place").order("activity_id").order("position").limit(200);
      if(last) query = query.or(`activity_id.gt.${last.activity_id},and(activity_id.eq.${last.activity_id},position.gt.${last.position})`);
      return query;
    }, row => `${row.activity_id}:${row.position}`),
  ]);
  return { activities,journeys,services:services.sort((a,b)=>a.position-b.position),deliveries,agreements,replacements,messages:[] };
}
