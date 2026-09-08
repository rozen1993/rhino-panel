import type { ActivityType, Role } from "@/lib/roles";

export type AunorActivityRow = {
  id: string; type: ActivityType; title: string;
  status: "Programada" | "En proceso" | "Entregada"; place: string;
  summary: string; service_id: string | null; not_performed_reason: string;
  publication_version: number; published_at: string; unread_count: number;
};
export type AunorJourney = { activity_id: string; position: number; start_date: string; end_date: string; place: string };
export type AunorService = { id: string; position: number; label: string; reference: string };
export type AunorDelivery = {
  id: string; activity_id: string; version: number; material_link: string;
  label: string; published_at: string; confirmed_at: string | null;
  confirmed_by: string | null; is_current: boolean;
};
export type AunorAgreement = {
  id: string; activity_id: string; channel: string; contacted_at: string;
  requester_declared: string; body: string; evidence_link: string;
  recorded_by: string; recorded_at: string; corrects_id: string | null; is_current: boolean;
};
export type AunorReplacement = {
  id: string; original_activity_id: string; substitute_activity_id: string;
  original_title: string; substitute_title: string; agreement_id: string;
  reason: string; evidence_note: string; evidence_link: string;
  recorded_by: string; recorded_at: string; corrects_id: string | null;
  confirmed_at: string | null; confirmed_by: string | null; is_current: boolean;
};
export type AunorMessage = {
  id: string; sequence: number; activity_id: string; author: string;
  author_role: "admin" | "aunor"; body: string; created_at: string;
  corrects_id: string | null; is_own: boolean;
};
export type AunorViews = {
  aunor_activities: { Row: AunorActivityRow; Relationships: [] };
  aunor_journeys: { Row: AunorJourney; Relationships: [] };
  aunor_services: { Row: AunorService; Relationships: [] };
  aunor_deliveries: { Row: AunorDelivery; Relationships: [] };
  aunor_agreements: { Row: AunorAgreement; Relationships: [] };
  aunor_replacements: { Row: AunorReplacement; Relationships: [] };
  aunor_messages: { Row: AunorMessage; Relationships: [] };
};
export type AunorWorkspace = {
  activities: AunorActivityRow[]; journeys: AunorJourney[];
  services: AunorService[]; deliveries: AunorDelivery[];
  agreements: AunorAgreement[]; replacements: AunorReplacement[]; messages: AunorMessage[];
};
export const aunorCommands = ["publish","delivery","agreement","replacement","message","read","confirm-delivery","confirm-replacement"] as const;
export type AunorCommand = typeof aunorCommands[number];
export function canUseAunor(role: Role | null): role is Role {
  return Boolean(role && !role.mustChangePassword && (role.id === "admin" || role.id === "aunor"));
}
export function canMutateAunor(role: Role | null, command: AunorCommand) {
  if (!canUseAunor(role)) return false;
  if (command === "message" || command === "read") return true;
  return command.startsWith("confirm-") ? role.id === "aunor" : role.id === "admin";
}
export const aunorDisclaimer = "Confirmar identifica lo revisado; no aprueba pagos ni equivalencias económicas. Los comentarios no confirman entregas ni reemplazos.";
export function aunorCode(id: string, type?: ActivityType) {
  return (type === "Edición" ? "ED" : type === "Grabación" ? "GR" : "AC") + "-" + id.replaceAll("-","").slice(-6).toUpperCase();
}
export function emptyAunorWorkspace(): AunorWorkspace {
  return {activities:[],journeys:[],services:[],deliveries:[],agreements:[],replacements:[],messages:[]};
}
