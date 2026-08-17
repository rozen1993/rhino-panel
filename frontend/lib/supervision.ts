import type { InternalStatus } from "@/components/status-pill";

export type SupervisionAction = "Observar" | "Aprobar" | "Cancelar";

export function getSupervisionActions(status: InternalStatus): readonly SupervisionAction[] {
  if (status === "Aprobada" || status === "Cancelada") return [];

  const actions: SupervisionAction[] = [];
  if (status === "En proceso" || status === "Por subir" || status === "Entregada") {
    actions.push("Observar");
  }
  if (status === "Entregada") actions.push("Aprobar");
  actions.push("Cancelar");
  return actions;
}
