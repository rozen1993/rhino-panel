import type { AunorStatus } from "@/components/aunor-status-pill";

export type AunorActivity = {
  id: string;
  date: string;
  type: string;
  title: string;
  place: string;
  status: AunorStatus;
  comments: readonly { date: string; text: string }[];
};

export const aunorActivities: readonly AunorActivity[] = [
  { id: "senalizacion", date: "18 ago · 06:30", type: "Operación", title: "Instalación de señalización preventiva", place: "Panamericana Norte · km 25", status: "Programada", comments: [] },
  { id: "chillon", date: "17 ago · 08:30", type: "Grabación", title: "Cobertura de mantenimiento en peaje Chillón", place: "Peaje Chillón", status: "En trabajo", comments: [{ date: "16 ago, 17:40", text: "Incluir una toma general del frente de trabajo, por favor." }] },
  { id: "cuadrilla", date: "15 ago · 11:00", type: "Coordinación", title: "Agenda de rodaje con cuadrilla norte", place: "Base norte", status: "Entregada", comments: [{ date: "15 ago, 15:10", text: "Recibido. La secuencia permite entender bien la intervención." }] },
  { id: "seguridad", date: "11 ago · 15:20", type: "Edición", title: "Resumen semanal de seguridad vial", place: "Lima", status: "Aprobada", comments: [] },
  { id: "desvio", date: "05 ago · 22:00", type: "Grabación", title: "Registro nocturno de desvío temporal", place: "Variante Pasamayo", status: "Cancelada", comments: [] },
] as const;
