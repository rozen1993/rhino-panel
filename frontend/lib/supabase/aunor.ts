import "server-only";
import { emptyAunorWorkspace, type AunorWorkspace } from "@/lib/aunor";
import { scopeAunorWorkspace, validAunorReadScope, type AunorReadScope } from "@/lib/aunor-read-scope";
import { isUuid } from "@/lib/uuid";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { collectCursorPages } from "@/lib/cursor-pages";

export async function readSupabaseAunor(scope: AunorReadScope = {scene:"admin"}): Promise<AunorWorkspace> {
  if (!validAunorReadScope(scope) || (scope.id !== undefined && !isUuid(scope.id))) throw new Error("Invalid Aunor scope");
  const db = await createSupabaseServerClient();
  const detail = scope.scene === "detail";
  const replacement = scope.scene === "replacement";
  // Caller-scoped public projections remain the authorization boundary.
  const readReplacements = () => collectCursorPages<AunorWorkspace["replacements"][number]>(last => {
    let query = db.from("aunor_replacements").select("id,original_activity_id,substitute_activity_id,original_title,substitute_title,agreement_id,reason,evidence_note,evidence_link,recorded_by,recorded_at,corrects_id,confirmed_at,confirmed_by,is_current",{count:"exact"}).order("id").limit(200);
    if (replacement) query = query.eq("id",scope.id!);
    if (detail) query = query.or(`original_activity_id.eq.${scope.id},substitute_activity_id.eq.${scope.id}`);
    if (last) query = query.gt("id",last.id);
    return query;
  }, row => row.id);
  const chosen = replacement ? await readReplacements() : [];
  if (replacement && !chosen.length) return emptyAunorWorkspace();
  const activityIds = replacement ? [chosen[0].original_activity_id,chosen[0].substitute_activity_id] : detail ? [scope.id!] : null;
  const [activities,services,deliveries,agreements,replacements,journeys] = await Promise.all([
    collectCursorPages<AunorWorkspace["activities"][number]>(last => {
      let query = db.from("aunor_activities").select("id,type,title,status,place,summary,service_id,not_performed_reason,publication_version,published_at,unread_count,delivered_at,material_link,recording_modes",{count:"exact"}).order("id").limit(200);
      if (activityIds) query = query.in("id",activityIds);
      if(last) query = query.gt("id", last.id);
      return query;
    }, row => row.id),
    scope.includeServices === false || replacement ? Promise.resolve([]) : collectCursorPages<AunorWorkspace["services"][number]>(last => {
      let query = db.from("aunor_services").select("id,position,label,reference",{count:"exact"}).order("id").limit(200);
      if(last) query = query.gt("id", last.id);
      return query;
    }, row => row.id),
    !["panel","detail","admin"].includes(scope.scene) ? Promise.resolve([]) : collectCursorPages<AunorWorkspace["deliveries"][number]>(last => {
      let query = db.from("aunor_deliveries").select("id,activity_id,version,material_link,label,published_at,confirmed_at,confirmed_by,is_current",{count:"exact"}).order("id").limit(200);
      if (detail) query = query.eq("activity_id",scope.id!);
      if (scope.scene === "panel") query = query.eq("is_current",true);
      if(last) query = query.gt("id", last.id);
      return query;
    }, row => row.id),
    !["detail","replacement","admin"].includes(scope.scene) ? Promise.resolve([]) : collectCursorPages<AunorWorkspace["agreements"][number]>(last => {
      let query = db.from("aunor_agreements").select("id,activity_id,channel,contacted_at,requester_declared,body,evidence_link,recorded_by,recorded_at,corrects_id,is_current",{count:"exact"}).order("id").limit(200);
      if (detail) query = query.eq("activity_id",scope.id!);
      if (replacement) query = query.eq("id",chosen[0].agreement_id);
      if(last) query = query.gt("id", last.id);
      return query;
    }, row => row.id),
    replacement ? Promise.resolve(chosen) : ["detail","acordado","admin"].includes(scope.scene) ? readReplacements() : Promise.resolve([]),
    collectCursorPages<AunorWorkspace["journeys"][number]>(last => {
      let query = db.from("aunor_journeys").select("activity_id,position,start_date,end_date,place",{count:"exact"}).order("activity_id").order("position").limit(200);
      if (activityIds) query = query.in("activity_id",activityIds);
      if(last) query = query.or(`activity_id.gt.${last.activity_id},and(activity_id.eq.${last.activity_id},position.gt.${last.position})`);
      return query;
    }, row => `${row.activity_id}:${row.position}`),
  ]);
  return scopeAunorWorkspace({ activities,journeys,services:services.sort((a,b)=>a.position-b.position),deliveries,agreements,replacements,messages:[] },scope);
}
