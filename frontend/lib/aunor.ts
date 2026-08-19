import type { AunorStatus } from "@/components/aunor-status-pill";
import type { SimulatedActivity } from "@/lib/activity-simulation";

export type AunorActivity = { id: string; date: string; type: string; title: string; place: string; status: AunorStatus };

export function aunorStatus(status: SimulatedActivity["status"]): AunorStatus {
  if (status === "En proceso" || status === "Por subir" || status === "Observada") return "En trabajo";
  return status;
}

/** Proyección explícita: ningún campo interno forma parte del objeto que consume la vista AUNOR. */
export function projectActivityForAunor(activity: SimulatedActivity): AunorActivity | null {
  if (activity.status === "Cancelada") return null;
  return { id: activity.id, date: activity.date, type: activity.type, title: activity.title, place: activity.place, status: aunorStatus(activity.status) };
}
