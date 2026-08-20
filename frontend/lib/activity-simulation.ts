"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  activities,
  requiresMaterialLink,
  showsProgress,
  type Activity,
  type ActivityType,
} from "@/lib/activities";
import type { ActivityDraftFields } from "@/lib/activity-draft";
import type { Role, RoleId } from "@/lib/roles";
import type { InternalStatus } from "@/components/status-pill";

export const activityStoreKey = "rhino:actividades-simuladas:v2";
const legacyStoreKey = "rhino:actividades-simuladas:v1";
const activityStoreEvent = "rhino:actividades-simuladas-cambio";

export type ActivityActor = {
  accountId: string;
  name: string;
  roleId: RoleId;
  roleLabel: string;
};
export type ActivityHistoryEntry = {
  status: InternalStatus;
  actor: string;
  actorAccountId?: string;
  actorRoleId?: RoleId;
  moment: string;
  reason?: string;
};
export type FieldVersion = {
  field: "materialLink" | "deliveryMessage" | "progress";
  value: string;
  actor: ActivityActor;
  moment: string;
  reason?: string;
};
export type ActivityComment = {
  id: string;
  text: string;
  author: ActivityActor;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
};
export type ActivityObservation = {
  id: string;
  message: string;
  createdBy: string;
  createdAt: string;
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  messageEditedBy?: string;
  messageEditedAt?: string;
  responseEditedBy?: string;
  responseEditedAt?: string;
  deletedBy?: string;
  deletedAt?: string;
  responseDeletedBy?: string;
  responseDeletedAt?: string;
};
export type ActivityRejection = {
  reason: string;
  resendAllowed: boolean;
  actor: ActivityActor;
  moment: string;
  resolvedAt?: string;
};

export type SimulatedActivity = Activity & {
  responsibleAccountId: string;
  description: string;
  deliveryDate: string;
  materialLink: string;
  deliveryMessage: string;
  placeReference: string;
  placeKm: string;
  placeDirection: string;
  createdBy: string;
  createdByAccountId?: string;
  updatedAt: string;
  version: number;
  idempotencyKey?: string;
  startedAt?: string;
  history: ActivityHistoryEntry[];
  fieldHistory: FieldVersion[];
  comments: ActivityComment[];
  preObservationStatus?: InternalStatus;
  observations: ActivityObservation[];
  rejection?: ActivityRejection;
  deletedAt?: string;
  deletedBy?: ActivityActor;
  deletionReason?: string;
};

const roleIdByType: Record<ActivityType, RoleId> = {
  Grabación: "grabacion",
  Edición: "edicion",
  Creatividad: "creatividad",
  Locución: "locucion",
};
export function actorFromRole(role: Role): ActivityActor {
  return {
    accountId: role.accountId ?? `test-${role.id}`,
    name: role.accountName ?? role.label,
    roleId: role.id,
    roleLabel: role.label,
  };
}
function actorLabel(actor: ActivityActor) {
  return `${actor.name} · ${actor.roleLabel}`;
}
function defaultResponsibleId(type: ActivityType) {
  return `test-${roleIdByType[type]}`;
}

const seedActivities: SimulatedActivity[] = activities.map((activity) => ({
  ...activity,
  responsibleAccountId: defaultResponsibleId(activity.type),
  description:
    activity.id === "peaje-chillon"
      ? "Cobertura audiovisual del mantenimiento preventivo en la caseta norte."
      : "Actividad registrada para la operación mensual.",
  deliveryDate: activity.dateTime,
  materialLink: activity.hasLink ? "https://onedrive.live.com/" : "",
  deliveryMessage: "",
  placeReference: activity.id === "peaje-chillon" ? "caseta norte" : "",
  placeKm: activity.id === "peaje-chillon" ? "25.4" : "",
  placeDirection: activity.id === "peaje-chillon" ? "Norte → Sur" : "",
  createdBy: "Coordinación",
  createdByAccountId: "test-coordinacion",
  updatedAt: activity.dateTime,
  version: 1,
  history: [
    {
      status: activity.status,
      actor: activity.responsible,
      moment: activity.dateTime,
    },
  ],
  fieldHistory: [],
  comments: [],
  preObservationStatus:
    activity.status === "Observada" ? "Entregada" : undefined,
  observations:
    activity.id === "peaje-chillon"
      ? [
          {
            id: "obs-peaje-chillon",
            message: "Añade 8 segundos y nivela el audio ambiente.",
            createdBy: "Supervisión",
            createdAt: "2026-08-12T09:18:00-05:00",
            response: "Plano extendido y audio nivelado.",
            respondedBy: "Grabación",
            respondedAt: "2026-08-12T10:42:00-05:00",
          },
        ]
      : [],
}));
const seedSnapshot = JSON.stringify(seedActivities);
const serverSnapshot = () => seedSnapshot;

function compatibleActivity(
  activity: Partial<SimulatedActivity> & Activity,
): SimulatedActivity {
  const type = activity.type;
  return {
    ...activity,
    responsibleAccountId:
      activity.responsibleAccountId ?? defaultResponsibleId(type),
    description: activity.description ?? "",
    deliveryDate: activity.deliveryDate ?? activity.dateTime,
    materialLink: activity.materialLink ?? "",
    deliveryMessage: activity.deliveryMessage ?? "",
    placeReference: activity.placeReference ?? "",
    placeKm: activity.placeKm ?? "",
    placeDirection: activity.placeDirection ?? "",
    createdBy: activity.createdBy ?? "Coordinación",
    updatedAt: activity.updatedAt ?? activity.dateTime,
    version: activity.version ?? 1,
    history: activity.history ?? [],
    fieldHistory: activity.fieldHistory ?? [],
    comments: activity.comments ?? [],
    observations: activity.observations ?? [],
  };
}
export function parseActivityStore(raw: string | null): SimulatedActivity[] {
  if (!raw) return seedActivities;
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value
          .filter((item): item is SimulatedActivity =>
            Boolean(
              item &&
                typeof item === "object" &&
                "id" in item &&
                "type" in item,
            ),
          )
          .map(compatibleActivity)
      : seedActivities;
  } catch {
    return seedActivities;
  }
}
export function activityStoreIsCorrupt(raw: string | null) {
  if (!raw) return false;
  try {
    const value: unknown = JSON.parse(raw);
    return (
      !Array.isArray(value) ||
      value.some((item) => !item || typeof item !== "object" || !("id" in item))
    );
  } catch {
    return true;
  }
}
export function readActivities(
  storage: Pick<Storage, "getItem">,
): SimulatedActivity[] {
  return parseActivityStore(
    storage.getItem(activityStoreKey) ?? storage.getItem(legacyStoreKey),
  );
}
function saveActivities(
  storage: Pick<Storage, "setItem">,
  next: SimulatedActivity[],
) {
  storage.setItem(activityStoreKey, JSON.stringify(next));
  window.dispatchEvent(new Event(activityStoreEvent));
}
function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(date)
        .replace(",", "");
}
function activityId(title: string) {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
  return `${slug || "actividad"}-${Date.now().toString(36)}`;
}

export type ActivityActionResult =
  | { ok: true; activity: SimulatedActivity }
  | { ok: false; error: string };
function updateActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  change: (activity: SimulatedActivity) => SimulatedActivity | string,
): ActivityActionResult {
  const current = readActivities(storage);
  const previous = current.find((item) => item.id === id);
  if (!previous || previous.deletedAt)
    return { ok: false, error: "La actividad no existe." };
  const result = change(previous);
  if (typeof result === "string") return { ok: false, error: result };
  const next = { ...result, version: result.version + 1 };
  saveActivities(
    storage,
    current.map((item) => (item.id === id ? next : item)),
  );
  return { ok: true, activity: next };
}
function withStatus(
  activity: SimulatedActivity,
  status: InternalStatus,
  actor: ActivityActor,
  now: string,
  reason?: string,
): SimulatedActivity {
  return {
    ...activity,
    status,
    updatedAt: now,
    startedAt:
      activity.startedAt ?? (status === "En proceso" ? now : undefined),
    history: [
      {
        status,
        actor: actorLabel(actor),
        actorAccountId: actor.accountId,
        actorRoleId: actor.roleId,
        moment: now,
        reason,
      },
      ...activity.history,
    ],
  };
}

export function upsertActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  fields: ActivityDraftFields,
  role: Role,
  existingId?: string,
  idempotencyKey?: string,
) {
  if (!role.createsOrders)
    throw new Error("Solo Coordinación puede crear o editar órdenes.");
  const current = readActivities(storage);
  const actor = actorFromRole(role);
  if (!existingId && idempotencyKey) {
    const duplicate = current.find(
      (item) => item.idempotencyKey === idempotencyKey,
    );
    if (duplicate) return duplicate;
  }
  const previous = existingId
    ? current.find((item) => item.id === existingId)
    : undefined;
  const now = new Date().toISOString();
  const status = (previous?.status || fields.status || "Programada") as InternalStatus;
  const id = previous?.id ?? activityId(fields.title);
  const responsibleAccountId =
    fields.responsibleAccountId ||
    previous?.responsibleAccountId ||
    defaultResponsibleId(fields.type);
  const next: SimulatedActivity = {
    id,
    date: displayDate(fields.date),
    dateTime: fields.date,
    type: fields.type,
    title: fields.title,
    responsible: fields.responsible,
    responsibleAccountId,
    status,
    progress: previous?.progress ?? (Number.parseInt(fields.progress, 10) || 0),
    place: fields.placeName || "Sin ubicación",
    hasLink: previous?.hasLink ?? Boolean(fields.materialLink),
    description: fields.description,
    deliveryDate: fields.deliveryDate,
    materialLink: previous?.materialLink ?? fields.materialLink,
    deliveryMessage: previous?.deliveryMessage ?? fields.notes,
    placeReference: fields.placeReference,
    placeKm: fields.placeKm,
    placeDirection: fields.placeDirection,
    createdBy: previous?.createdBy ?? actorLabel(actor),
    createdByAccountId: previous?.createdByAccountId ?? actor.accountId,
    updatedAt: now,
    version: previous?.version ?? 1,
    idempotencyKey: previous?.idempotencyKey ?? idempotencyKey,
    startedAt: previous?.startedAt,
    history: previous?.history ?? [
      {
        status,
        actor: actorLabel(actor),
        actorAccountId: actor.accountId,
        actorRoleId: actor.roleId,
        moment: now,
      },
    ],
    fieldHistory: previous?.fieldHistory ?? [],
    comments: previous?.comments ?? [],
    preObservationStatus: previous?.preObservationStatus,
    observations: previous?.observations ?? [],
    rejection: previous?.rejection,
  };
  saveActivities(storage, [next, ...current.filter((item) => item.id !== id)]);
  return next;
}

export function nextActivityStatus(
  _type: ActivityType,
  status: InternalStatus,
): InternalStatus | null {
  if (status === "Programada") return "En proceso";
  if (status === "En proceso") return "Por subir";
  if (status === "Por subir") return "Entregada";
  return null;
}
function validateDelivery(activity: SimulatedActivity) {
  if (requiresMaterialLink(activity.type) && !activity.materialLink)
    return "Añade el enlace de OneDrive antes de entregar.";
  if (showsProgress(activity.type) && activity.progress !== 100)
    return "El avance debe llegar a 100% antes de entregar.";
  return null;
}
export function advanceActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  actor: ActivityActor,
  expectedVersion?: number,
): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    if (activity.responsibleAccountId !== actor.accountId)
      return "Solo la persona responsable puede actualizar esta orden.";
    if (expectedVersion !== undefined && activity.version !== expectedVersion)
      return "La actividad cambió; revisa la versión nueva antes de continuar.";
    if (
      activity.status === "Observada" ||
      (activity.status === "Rechazada" && activity.rejection?.resendAllowed)
    ) {
      const issue = validateDelivery(activity);
      if (issue) return issue;
      const now = new Date().toISOString();
      const observations =
        activity.status === "Observada"
          ? activity.observations.map((item) =>
              !item.resolvedAt
                ? { ...item, resolvedAt: now, resolvedBy: actorLabel(actor) }
                : item,
            )
          : activity.observations;
      return {
        ...withStatus(
          activity,
          "Entregada",
          actor,
          now,
          "Material corregido y reenviado",
        ),
        observations,
        preObservationStatus: undefined,
        rejection: activity.rejection
          ? { ...activity.rejection, resolvedAt: now }
          : undefined,
      };
    }
    const status = nextActivityStatus(activity.type, activity.status);
    if (!status)
      return "Esta actividad no puede avanzar desde su estado actual.";
    if (status === "Entregada") {
      const issue = validateDelivery(activity);
      if (issue) return issue;
    }
    return withStatus(activity, status, actor, new Date().toISOString());
  });
}

export function updateDelivery(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  fields: Pick<ActivityDraftFields, "materialLink" | "progress" | "notes">,
  actor: ActivityActor,
  expectedVersion: number,
): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    if (activity.responsibleAccountId !== actor.accountId)
      return "Solo la persona responsable puede cambiar la entrega.";
    if (activity.version !== expectedVersion)
      return "La actividad cambió mientras la editabas. Revísala antes de guardar.";
    if (
      ["Aprobada", "Cancelada"].includes(activity.status) ||
      (activity.status === "Rechazada" && !activity.rejection?.resendAllowed)
    )
      return "La actividad está bloqueada para edición.";
    const now = new Date().toISOString();
    const versions: FieldVersion[] = [...activity.fieldHistory];
    if (fields.materialLink !== activity.materialLink)
      versions.unshift({
        field: "materialLink",
        value: fields.materialLink,
        actor,
        moment: now,
      });
    if (fields.notes !== activity.deliveryMessage)
      versions.unshift({
        field: "deliveryMessage",
        value: fields.notes,
        actor,
        moment: now,
      });
    const progress = Number.parseInt(fields.progress, 10) || 0;
    if (progress !== activity.progress)
      versions.unshift({
        field: "progress",
        value: String(progress),
        actor,
        moment: now,
      });
    return {
      ...activity,
      materialLink: fields.materialLink,
      hasLink: Boolean(fields.materialLink),
      deliveryMessage: fields.notes,
      progress,
      fieldHistory: versions,
      updatedAt: now,
    };
  });
}

export function observeActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  message: string,
  actor: ActivityActor,
  expectedVersion?: number,
): ActivityActionResult {
  if (actor.roleId !== "supervision")
    return { ok: false, error: "Solo Supervisión puede evaluar." };
  return updateActivity(storage, id, (activity) => {
    if (activity.status !== "Entregada")
      return "Solo se puede observar una actividad entregada.";
    if (expectedVersion !== undefined && activity.version !== expectedVersion)
      return "La actividad cambió; revisa la versión nueva antes de decidir.";
    if (!message.trim()) return "Escribe el motivo de la observación.";
    const now = new Date().toISOString();
    return {
      ...withStatus(activity, "Observada", actor, now, message.trim()),
      preObservationStatus: "Entregada",
      observations: [
        {
          id: `obs-${Date.now().toString(36)}`,
          message: message.trim(),
          createdBy: actorLabel(actor),
          createdAt: now,
        },
        ...activity.observations,
      ],
    };
  });
}
export function rejectActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  reason: string,
  resendAllowed: boolean,
  actor: ActivityActor,
  expectedVersion?: number,
): ActivityActionResult {
  if (actor.roleId !== "supervision")
    return { ok: false, error: "Solo Supervisión puede evaluar." };
  return updateActivity(storage, id, (activity) => {
    if (activity.status !== "Entregada")
      return "Solo se puede rechazar una actividad entregada.";
    if (expectedVersion !== undefined && activity.version !== expectedVersion)
      return "La actividad cambió; revisa la versión nueva antes de decidir.";
    if (!reason.trim()) return "Escribe el motivo del rechazo.";
    const now = new Date().toISOString();
    return {
      ...withStatus(activity, "Rechazada", actor, now, reason.trim()),
      rejection: { reason: reason.trim(), resendAllowed, actor, moment: now },
    };
  });
}
export function respondToObservation(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  response: string,
  actor: ActivityActor,
): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    const open = activity.observations.findIndex((item) => !item.resolvedAt);
    if (activity.status !== "Observada" || open < 0)
      return "Esta actividad no tiene una observación abierta.";
    if (activity.responsibleAccountId !== actor.accountId)
      return "Solo el responsable puede responder.";
    if (!response.trim()) return "Escribe una respuesta antes de enviarla.";
    const now = new Date().toISOString();
    return {
      ...activity,
      updatedAt: now,
      observations: activity.observations.map((item, index) =>
        index === open
          ? {
              ...item,
              response: response.trim(),
              respondedBy: actorLabel(actor),
              respondedAt: now,
            }
          : item,
      ),
    };
  });
}
export function resolveObservation(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  actor: ActivityActor,
): ActivityActionResult {
  if (actor.roleId !== "supervision")
    return { ok: false, error: "Solo Supervisión puede resolver observaciones." };
  return updateActivity(storage, id, (activity) => {
    const open = activity.observations.findIndex((item) => !item.resolvedAt);
    if (activity.status !== "Observada" || open < 0)
      return "Esta actividad no tiene una observación abierta.";
    if (!activity.observations[open].response)
      return "El responsable todavía no respondió.";
    const now = new Date().toISOString();
    return {
      ...withStatus(activity, "Entregada", actor, now, "Corrección revisada"),
      preObservationStatus: undefined,
      observations: activity.observations.map((item, index) =>
        index === open
          ? { ...item, resolvedBy: actorLabel(actor), resolvedAt: now }
          : item,
      ),
    };
  });
}
export function editObservationText(
  storage: Pick<Storage, "getItem" | "setItem">,
  activityId: string,
  observationId: string,
  field: "message" | "response",
  text: string,
  actor: ActivityActor,
): ActivityActionResult {
  return updateActivity(storage, activityId, (activity) => {
    const index = activity.observations.findIndex(
      (item) => item.id === observationId,
    );
    if (index < 0) return "La observación no existe.";
    const target = activity.observations[index];
    if (target.resolvedAt || !text.trim())
      return "Este mensaje ya no se puede editar.";
    const ownResponse =
      field === "response" && activity.responsibleAccountId === actor.accountId;
    const ownObservation =
      field === "message" && actor.roleId === "supervision";
    if (!ownResponse && !ownObservation)
      return "Solo el autor puede editar este mensaje.";
    const now = new Date().toISOString();
    const edited =
      field === "message"
        ? {
            ...target,
            message: text.trim(),
            messageEditedBy: actorLabel(actor),
            messageEditedAt: now,
          }
        : {
            ...target,
            response: text.trim(),
            responseEditedBy: actorLabel(actor),
            responseEditedAt: now,
          };
    return {
      ...activity,
      updatedAt: now,
      observations: activity.observations.map((item, itemIndex) =>
        itemIndex === index ? edited : item,
      ),
    };
  });
}
export function deleteObservationText(
  storage: Pick<Storage, "getItem" | "setItem">,
  activityId: string,
  observationId: string,
  field: "message" | "response",
  actor: ActivityActor,
): ActivityActionResult {
  return updateActivity(storage, activityId, (activity) => {
    const index = activity.observations.findIndex(
      (item) => item.id === observationId,
    );
    if (index < 0) return "La observación no existe.";
    const target = activity.observations[index];
    if (target.resolvedAt)
      return "Una observación resuelta ya no se puede eliminar.";
    const now = new Date().toISOString();
    if (field === "response") {
      if (activity.responsibleAccountId !== actor.accountId)
        return "Solo el autor puede eliminar su respuesta.";
      return {
        ...activity,
        updatedAt: now,
        observations: activity.observations.map((item, i) =>
          i === index
            ? {
                ...item,
                response: undefined,
                responseDeletedBy: actorLabel(actor),
                responseDeletedAt: now,
              }
            : item,
        ),
      };
    }
    if (actor.roleId !== "supervision")
      return "Solo Supervisión puede retirar su observación.";
    const restored = withStatus(
      activity,
      "Entregada",
      actor,
      now,
      "Observación retirada",
    );
    return {
      ...restored,
      preObservationStatus: undefined,
      observations: activity.observations.map((item, i) =>
        i === index
          ? {
              ...item,
              deletedBy: actorLabel(actor),
              deletedAt: now,
              resolvedBy: actorLabel(actor),
              resolvedAt: now,
            }
          : item,
      ),
    };
  });
}

export function approveActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  actor: ActivityActor,
  expectedVersion?: number,
): ActivityActionResult {
  if (actor.roleId !== "supervision")
    return { ok: false, error: "Solo Supervisión puede evaluar." };
  return updateActivity(storage, id, (activity) => {
    if (activity.status !== "Entregada")
      return "Solo se puede aprobar una actividad entregada.";
    if (expectedVersion !== undefined && activity.version !== expectedVersion)
      return "La actividad cambió; revisa la versión nueva antes de aprobar.";
    const issue = validateDelivery(activity);
    if (issue) return issue;
    if (activity.observations.some((item) => !item.resolvedAt))
      return "Resuelve las observaciones abiertas antes de aprobar.";
    return withStatus(activity, "Aprobada", actor, new Date().toISOString());
  });
}
export function cancelActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  reason: string,
  actor: ActivityActor,
): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    if (actor.roleId !== "coordinacion")
      return "Solo Coordinación puede cancelar.";
    if (!reason.trim()) return "Escribe el motivo de cancelación.";
    if (activity.status === "Aprobada" || activity.status === "Cancelada")
      return "Esta actividad no se puede cancelar.";
    return withStatus(
      activity,
      "Cancelada",
      actor,
      new Date().toISOString(),
      reason.trim(),
    );
  });
}
export function softDeleteActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  reason: string,
  actor: ActivityActor,
): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    if (actor.roleId !== "coordinacion")
      return "Solo Coordinación puede eliminar órdenes.";
    if (activity.status !== "Programada" || activity.startedAt)
      return "Solo se elimina una orden que todavía no empezó.";
    if (!reason.trim()) return "Escribe el motivo de eliminación.";
    const now = new Date().toISOString();
    return {
      ...activity,
      deletedAt: now,
      deletedBy: actor,
      deletionReason: reason.trim(),
      updatedAt: now,
    };
  });
}
export function addInternalComment(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  text: string,
  actor: ActivityActor,
): ActivityActionResult {
  return updateActivity(storage, id, (activity) =>
    !text.trim()
      ? "Escribe un comentario."
      : {
          ...activity,
          updatedAt: new Date().toISOString(),
          comments: [
            {
              id: `comment-${Date.now().toString(36)}`,
              text: text.trim(),
              author: actor,
              createdAt: new Date().toISOString(),
            },
            ...activity.comments,
          ],
        },
  );
}
export function editInternalComment(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  commentId: string,
  text: string,
  actor: ActivityActor,
): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    const comment = activity.comments.find(
      (item) => item.id === commentId && !item.deletedAt,
    );
    if (!comment || comment.author.accountId !== actor.accountId)
      return "Solo el autor puede editar este comentario.";
    if (!text.trim()) return "El comentario no puede quedar vacío.";
    return {
      ...activity,
      updatedAt: new Date().toISOString(),
      comments: activity.comments.map((item) =>
        item.id === commentId
          ? { ...item, text: text.trim(), editedAt: new Date().toISOString() }
          : item,
      ),
    };
  });
}
export function deleteInternalComment(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  commentId: string,
  actor: ActivityActor,
): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    const comment = activity.comments.find(
      (item) => item.id === commentId && !item.deletedAt,
    );
    if (!comment || comment.author.accountId !== actor.accountId)
      return "Solo el autor puede eliminar este comentario.";
    return {
      ...activity,
      updatedAt: new Date().toISOString(),
      comments: activity.comments.map((item) =>
        item.id === commentId
          ? { ...item, deletedAt: new Date().toISOString() }
          : item,
      ),
    };
  });
}

export function useSimulatedActivities() {
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if ([activityStoreKey, legacyStoreKey].includes(event.key ?? ""))
        notify();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(activityStoreEvent, notify);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(activityStoreEvent, notify);
    };
  }, []);
  const snapshot = useCallback(
    () =>
      window.localStorage.getItem(activityStoreKey) ??
      window.localStorage.getItem(legacyStoreKey) ??
      seedSnapshot,
    [],
  );
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => parseActivityStore(raw), [raw]);
}
export function useActivityStoreHealth() {
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if ([activityStoreKey, legacyStoreKey].includes(event.key ?? ""))
        notify();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(activityStoreEvent, notify);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(activityStoreEvent, notify);
    };
  }, []);
  const snapshot = useCallback(
    () =>
      window.localStorage.getItem(activityStoreKey) ??
      window.localStorage.getItem(legacyStoreKey),
    [],
  );
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  return { corrupt: activityStoreIsCorrupt(raw) };
}
