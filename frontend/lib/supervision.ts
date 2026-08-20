import type { InternalStatus } from "@/components/status-pill";

export type SupervisionAction = "Observar" | "Rechazar" | "Aprobar";

export function getSupervisionActions(status: InternalStatus): readonly SupervisionAction[] {
  if (status !== "Entregada") return [];

  const actions: SupervisionAction[] = [];
  actions.push("Observar", "Rechazar", "Aprobar");
  return actions;
}
