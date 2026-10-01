import type { ActivityDraftFields } from "./activity-draft";
import { activityPlanningError } from "./activity-validation";
import { safeMaterialUrl } from "./external-link";
import { calendarDateInLima } from "./historical";
import type { AunorWorkspace } from "./aunor";
import { previewContractRelation } from "./admin-activity-management";

export type HistoricalRegistration = ActivityDraftFields & {
  serviceId: string;
  confirmed: boolean;
};
export function historicalRegistrationError(
  input: unknown,
  today = calendarDateInLima(new Date()),
): string | null {
  const planning = activityPlanningError(input);
  if (planning) return planning;
  const p = input as HistoricalRegistration;
  if (p.confirmed !== true)
    return "Confirma que el trabajo ya fue terminado y entregado.";
  if (!p.classification) return "Selecciona Estándar o Especial.";
  if (
    typeof p.materialLink !== "string" ||
    p.materialLink.length > 3000 ||
    !safeMaterialUrl(p.materialLink.trim())
  )
    return "Añade un enlace HTTPS válido del material final.";
  if (typeof p.responsibleAccountId !== "string" || !p.responsibleAccountId)
    return "Selecciona el responsable del trabajo.";
  if (
    typeof p.serviceId !== "string" ||
    (p.serviceId !== "" && !/^[a-z-]{1,60}$/.test(p.serviceId))
  )
    return "Selecciona un servicio contractual válido.";
  if (p.type !== "Edición" && p.deliveryDueOn)
    return "Solo Edición tiene fecha de entrega del proyecto.";
  const last =
    p.type === "Edición"
      ? p.deliveryDueOn!
      : p.spans
          .map((s) => s.end)
          .sort()
          .at(-1)!;
  if (last >= today)
    return "El registro histórico es para trabajos anteriores a hoy. Para los nuevos, usa Planificar actividad.";
  return null;
}
export function historicalPreview(
  w: AunorWorkspace,
  p: HistoricalRegistration,
) {
  const id = "preview-historical-work";
  const spans =
    p.type === "Edición"
      ? [{ start: p.deliveryDueOn ?? "", end: p.deliveryDueOn ?? "" }]
      : p.spans;
  const source: AunorWorkspace = {
    ...w,
    activities: [
      ...w.activities,
      {
        id,
        type: p.type,
        title: p.title,
        status: "Entregada",
        place: p.placeName,
        summary: p.description,
        service_id: null,
        not_performed_reason: "",
        publication_version: 0,
        published_at: "",
        unread_count: 0,
        delivery_due_on: p.type === "Edición" ? p.deliveryDueOn : null,
      },
    ],
    journeys: [
      ...w.journeys,
      ...spans.map((s, i) => ({
        activity_id: id,
        position: i + 1,
        start_date: s.start,
        end_date: s.end,
        place: s.place ?? p.placeName,
      })),
    ],
  };
  return previewContractRelation(
    source,
    id,
    p.serviceId,
    "",
    p.description || p.title,
  );
}
