import type { BursonStatus } from "@/components/burson-status-pill";

export type BursonRequest = {
  id: string;
  request: string;
  date: string;
  responsible: string;
  material: string;
  status: BursonStatus;
  rhinoPending: string;
  bursonPending: string;
};

export const bursonRequests: readonly BursonRequest[] = [
  { id: "campana-invierno", request: "Campaña de seguridad en invierno", date: "16 ago 2026", responsible: "Martín", material: "Selección de fotografías de vía", status: "En proceso", rhinoPending: "Enviar selección final", bursonPending: "Validar textos de campaña" },
  { id: "nota-desvios", request: "Nota sobre desvíos temporales", date: "13 ago 2026", responsible: "Sin asignar", material: "Enlace a tomas de señalización", status: "Solicitado", rhinoPending: "Asignar responsable", bursonPending: "Confirmar fecha de publicación" },
  { id: "resumen-julio", request: "Resumen audiovisual de julio", date: "02 ago 2026", responsible: "Martín", material: "Enlace al resumen mensual", status: "Entregado", rhinoPending: "Sin pendientes", bursonPending: "Dar conformidad al material" },
] as const;
