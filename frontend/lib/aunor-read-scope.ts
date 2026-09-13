import { emptyAunorWorkspace, type AunorWorkspace } from "@/lib/aunor";

export type AunorReadScene = "panel" | "calendar" | "acordado" | "detail" | "replacement" | "admin";
export type AunorReadScope = { scene: AunorReadScene; id?: string; includeServices?: boolean };

export function validAunorReadScope(value: unknown): value is AunorReadScope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const s = value as AunorReadScope;
  if (!["panel", "calendar", "acordado", "detail", "replacement", "admin"].includes(s.scene)) return false;
  if (s.includeServices !== undefined && typeof s.includeServices !== "boolean") return false;
  return s.scene === "detail" || s.scene === "replacement"
    ? typeof s.id === "string" && /^[a-z0-9-]{1,100}$/i.test(s.id)
    : s.id === undefined;
}

// Same scene boundaries for isolated examples and server-side Supabase reads.
export function scopeAunorWorkspace(w: AunorWorkspace, scope: AunorReadScope): AunorWorkspace {
  const result = { ...w, messages: [] };
  if (scope.scene === "replacement") {
    const r = w.replacements.find(r => r.id === scope.id);
    if (!r) return emptyAunorWorkspace();
    const ids = [r.original_activity_id, r.substitute_activity_id];
    return { ...emptyAunorWorkspace(), replacements: [r],
      activities: w.activities.filter(a => ids.includes(a.id)),
      journeys: w.journeys.filter(j => ids.includes(j.activity_id)),
      agreements: w.agreements.filter(g => g.id === r.agreement_id) };
  }
  if (scope.scene === "detail") {
    result.activities = w.activities.filter(a => a.id === scope.id);
    result.journeys = w.journeys.filter(j => j.activity_id === scope.id);
    result.deliveries = w.deliveries.filter(d => d.activity_id === scope.id);
    result.agreements = w.agreements.filter(g => g.activity_id === scope.id);
    result.replacements = w.replacements.filter(r => r.original_activity_id === scope.id || r.substitute_activity_id === scope.id);
  } else if (scope.scene !== "admin") {
    result.agreements = [];
    if (scope.scene !== "acordado") result.replacements = [];
    result.deliveries = scope.scene === "panel" ? w.deliveries.filter(d => d.is_current) : [];
  }
  if (scope.includeServices === false) result.services = [];
  return result;
}
