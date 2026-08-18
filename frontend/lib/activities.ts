import type { InternalStatus } from "@/components/status-pill";
import { type ActivityType, activityTypes } from "@/lib/roles";

export { activityTypes };
export type { ActivityType };

export type Activity = {
  id: string;
  date: string;
  dateTime: string;
  type: ActivityType;
  title: string;
  responsible: string;
  status: InternalStatus;
  progress?: number;
  place: string;
  hasLink: boolean;
};

export const activities: readonly Activity[] = [
  {
    id: "peaje-chillon",
    date: "Hoy 08:30",
    dateTime: "2026-08-17T08:30",
    type: "Grabación",
    title: "Cobertura de mantenimiento en peaje Chillón",
    responsible: "Johann",
    status: "Observada",
    place: "peaje Chillón",
    hasLink: true,
  },
  {
    id: "cierre-carril",
    date: "13 ago 06:00",
    dateTime: "2026-08-13T06:00",
    type: "Locución",
    title: "Locución para spot de seguridad vial",
    responsible: "Sin asignar",
    status: "Programada",
    place: "Cabina de locución",
    hasLink: false,
  },
  {
    id: "resumen-seguridad",
    date: "11 ago 15:20",
    dateTime: "2026-08-11T15:20",
    type: "Edición",
    title: "Resumen semanal de seguridad vial",
    responsible: "Eduardo",
    status: "En proceso",
    progress: 55,
    place: "Sala de edición",
    hasLink: true,
  },
  {
    id: "vuelve-seguro",
    date: "10 ago 17:40",
    dateTime: "2026-08-10T17:40",
    type: "Creatividad",
    title: "Piezas para campaña «Vuelve seguro»",
    responsible: "Chiara",
    status: "Por subir",
    progress: 100,
    place: "Oficina Rhino",
    hasLink: true,
  },
  {
    id: "agenda-cuadrilla-norte",
    date: "08 ago 11:00",
    dateTime: "2026-08-08T11:00",
    type: "Coordinación",
    title: "Agenda de rodaje con cuadrilla norte",
    responsible: "Chiara",
    status: "Entregada",
    place: "Base norte",
    hasLink: false,
  },
] as const;

export const monthCounts = [0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0] as const;

export function getActivity(id: string) {
  return activities.find((activity) => activity.id === id);
}

export function showsProgress(type: ActivityType) {
  return type === "Edición" || type === "Creatividad";
}
