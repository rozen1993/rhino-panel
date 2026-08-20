import type { InternalStatus } from "@/components/status-pill";
import { type ActivityType, activityTypes } from "@/lib/roles";

export { activityTypes };
export type { ActivityType };
export type Activity = { id: string; date: string; dateTime: string; type: ActivityType; title: string; responsible: string; status: InternalStatus; progress?: number; place: string; hasLink: boolean };

export const activities: readonly Activity[] = [
  { id: "peaje-chillon", date: "Hoy 08:30", dateTime: "2026-08-17T08:30", type: activityTypes[0], title: "Cobertura de mantenimiento en peaje Chillon", responsible: "Grabacion", status: "Observada", place: "peaje Chillon", hasLink: true },
  { id: "cierre-carril", date: "13 ago 06:00", dateTime: "2026-08-13T06:00", type: activityTypes[3], title: "Locucion para spot de seguridad vial", responsible: "Locucion", status: "Programada", place: "Cabina de locucion", hasLink: false },
  { id: "resumen-seguridad", date: "11 ago 15:20", dateTime: "2026-08-11T15:20", type: activityTypes[1], title: "Resumen semanal de seguridad vial", responsible: "Edicion", status: "En proceso", progress: 55, place: "Sala de edicion", hasLink: true },
  { id: "vuelve-seguro", date: "10 ago 17:40", dateTime: "2026-08-10T17:40", type: activityTypes[2], title: "Piezas para campana Vuelve seguro", responsible: "Creatividad", status: "Por subir", progress: 100, place: "Oficina Rhino", hasLink: true },
] as const;
export const monthCounts = [0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0] as const;
export function getActivity(id: string) { return activities.find((activity) => activity.id === id); }
export function showsProgress(type: ActivityType) { return type === activityTypes[1] || type === activityTypes[2]; }
export function requiresLocation(type: ActivityType) { return type === activityTypes[0]; }
export function requiresMaterialLink(type: ActivityType) { return activityTypes.includes(type); }
