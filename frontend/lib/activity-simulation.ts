"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { activities, type Activity, type ActivityType } from "@/lib/activities";
import type { ActivityDraftFields } from "@/lib/activity-draft";
import type { Role } from "@/lib/roles";
import type { InternalStatus } from "@/components/status-pill";

export const activityStoreKey = "rhino:actividades-simuladas:v1";
const activityStoreEvent = "rhino:actividades-simuladas-cambio";

export type ActivityHistoryEntry = { status: InternalStatus; actor: string; moment: string };
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
export type SimulatedActivity = Activity & {
  description: string;
  deliveryDate: string;
  materialLink: string;
  placeReference: string;
  placeKm: string;
  placeDirection: string;
  createdBy: string;
  updatedAt: string;
  history: ActivityHistoryEntry[];
  preObservationStatus?: InternalStatus;
  observations: ActivityObservation[];
};

const seedActivities: SimulatedActivity[] = activities.map((activity) => ({
  ...activity,
  description: activity.id === "peaje-chillon" ? "Cobertura audiovisual del mantenimiento preventivo en la caseta norte." : "Actividad registrada para la operación mensual.",
  deliveryDate: activity.dateTime,
  materialLink: activity.hasLink ? "https://onedrive.live.com/" : "",
  placeReference: activity.id === "peaje-chillon" ? "caseta norte" : "",
  placeKm: activity.id === "peaje-chillon" ? "25.4" : "",
  placeDirection: activity.id === "peaje-chillon" ? "Norte → Sur" : "",
  createdBy: "Coordinación",
  updatedAt: activity.dateTime,
  history: [{ status: activity.status, actor: activity.responsible, moment: activity.dateTime }],
  preObservationStatus: activity.status === "Observada" ? "Por subir" : undefined,
  observations: activity.id === "peaje-chillon" ? [{
    id: "obs-peaje-chillon",
    message: "El plano del panel variable termina antes de mostrar el tránsito. Añade 8 segundos y nivela el audio ambiente.",
    createdBy: "Supervisión",
    createdAt: "2026-08-12T09:18:00-05:00",
    response: "Plano extendido y audio nivelado. Reemplacé el archivo en el mismo enlace.",
    respondedBy: "Grabación",
    respondedAt: "2026-08-12T10:42:00-05:00",
  }] : [],
}));

const seedSnapshot = JSON.stringify(seedActivities);
const serverSnapshot = () => seedSnapshot;

export function parseActivityStore(raw: string | null): SimulatedActivity[] {
  if (!raw) return seedActivities;
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as SimulatedActivity[]).map((activity) => ({ ...activity, observations: activity.observations ?? [] })) : seedActivities;
  } catch {
    return seedActivities;
  }
}

export function activityStoreIsCorrupt(raw: string | null) {
  if (!raw) return false;
  try { return !Array.isArray(JSON.parse(raw)); } catch { return true; }
}

export function readActivities(storage: Pick<Storage, "getItem">): SimulatedActivity[] {
  return parseActivityStore(storage.getItem(activityStoreKey));
}

function saveActivities(storage: Pick<Storage, "setItem">, next: SimulatedActivity[]) {
  storage.setItem(activityStoreKey, JSON.stringify(next));
  window.dispatchEvent(new Event(activityStoreEvent));
}

function displayDate(dateTime: string) {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return dateTime;
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(date).replace(",", "");
}

function activityId(title: string) {
  const slug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42);
  return `${slug || "actividad"}-${Date.now().toString(36)}`;
}

export function upsertActivity(storage: Pick<Storage, "getItem" | "setItem">, fields: ActivityDraftFields, role: Role, existingId?: string) {
  const current = readActivities(storage);
  const previous = existingId ? current.find((item) => item.id === existingId) : undefined;
  const now = new Date().toISOString();
  const status = (fields.status || previous?.status || "Programada") as InternalStatus;
  const id = previous?.id ?? activityId(fields.title);
  const next: SimulatedActivity = {
    id,
    date: displayDate(fields.date),
    dateTime: fields.date,
    type: fields.type as ActivityType,
    title: fields.title,
    responsible: fields.responsible,
    status,
    progress: Number.parseInt(fields.progress, 10) || 0,
    place: fields.placeName || "Sin ubicación",
    hasLink: Boolean(fields.materialLink),
    description: fields.description,
    deliveryDate: fields.deliveryDate,
    materialLink: fields.materialLink,
    placeReference: fields.placeReference,
    placeKm: fields.placeKm,
    placeDirection: fields.placeDirection,
    createdBy: previous?.createdBy ?? role.label,
    updatedAt: now,
    history: previous?.history ?? [{ status, actor: role.label, moment: now }],
    preObservationStatus: previous?.preObservationStatus,
    observations: previous?.observations ?? [],
  };
  saveActivities(storage, [next, ...current.filter((item) => item.id !== id)]);
  return next;
}

export function nextActivityStatus(type: ActivityType, status: InternalStatus): InternalStatus | null {
  if (status === "Programada") return "En proceso";
  if (status === "En proceso") return type === "Coordinación" ? "Entregada" : "Por subir";
  if (status === "Por subir") return "Entregada";
  return null;
}

export function advanceActivity(storage: Pick<Storage, "getItem" | "setItem">, id: string, actor: string) {
  const current = readActivities(storage);
  const previous = current.find((item) => item.id === id);
  if (!previous) return null;
  const status = nextActivityStatus(previous.type, previous.status);
  if (!status) return previous;
  const now = new Date().toISOString();
  const next = { ...previous, status, updatedAt: now, history: [{ status, actor, moment: now }, ...previous.history] };
  saveActivities(storage, current.map((item) => item.id === id ? next : item));
  return next;
}

export type ActivityActionResult = { ok: true; activity: SimulatedActivity } | { ok: false; error: string };

function updateActivity(storage: Pick<Storage, "getItem" | "setItem">, id: string, update: (activity: SimulatedActivity) => SimulatedActivity | string): ActivityActionResult {
  const current = readActivities(storage);
  const previous = current.find((activity) => activity.id === id);
  if (!previous) return { ok: false, error: "La actividad no existe." };
  const result = update(previous);
  if (typeof result === "string") return { ok: false, error: result };
  saveActivities(storage, current.map((activity) => activity.id === id ? result : activity));
  return { ok: true, activity: result };
}

function withStatus(activity: SimulatedActivity, status: InternalStatus, actor: string, now: string): SimulatedActivity {
  return { ...activity, status, updatedAt: now, history: [{ status, actor, moment: now }, ...activity.history] };
}

export function observeActivity(storage: Pick<Storage, "getItem" | "setItem">, id: string, message: string, actor: string): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    if (!["En proceso", "Por subir", "Entregada"].includes(activity.status)) return "Solo se puede observar una actividad en proceso, por subir o entregada.";
    if (!message.trim()) return "Escribe el motivo de la observación.";
    const now = new Date().toISOString();
    const observed = withStatus(activity, "Observada", actor, now);
    return { ...observed, preObservationStatus: activity.status, observations: [{ id: `obs-${Date.now().toString(36)}`, message: message.trim(), createdBy: actor, createdAt: now }, ...activity.observations] };
  });
}

export function respondToObservation(storage: Pick<Storage, "getItem" | "setItem">, id: string, response: string, actor: string): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    const open = activity.observations.findIndex((observation) => !observation.resolvedAt);
    if (activity.status !== "Observada" || open < 0) return "Esta actividad no tiene una observación abierta.";
    if (!response.trim()) return "Escribe una respuesta antes de enviarla.";
    const now = new Date().toISOString();
    const observations = activity.observations.map((observation, index) => index === open ? { ...observation, response: response.trim(), respondedBy: actor, respondedAt: now } : observation);
    return { ...activity, observations, updatedAt: now };
  });
}

export function editObservationText(storage: Pick<Storage, "getItem" | "setItem">, activityId: string, observationId: string, field: "message" | "response", text: string, actor: string): ActivityActionResult {
  return updateActivity(storage, activityId, (activity) => {
    const index = activity.observations.findIndex((observation) => observation.id === observationId);
    if (index < 0) return "La observación no existe.";
    const target = activity.observations[index];
    if (target.resolvedAt) return "Una observación resuelta ya no se puede editar.";
    if (!text.trim()) return "El mensaje no puede quedar vacío.";
    if (field === "response" && !target.response) return "Todavía no existe una respuesta para editar.";
    const now = new Date().toISOString();
    const edited = field === "message"
      ? { ...target, message: text.trim(), messageEditedBy: actor, messageEditedAt: now }
      : { ...target, response: text.trim(), responseEditedBy: actor, responseEditedAt: now };
    return { ...activity, observations: activity.observations.map((observation, itemIndex) => itemIndex === index ? edited : observation), updatedAt: now };
  });
}

export function deleteObservationText(storage: Pick<Storage, "getItem" | "setItem">, activityId: string, observationId: string, field: "message" | "response", actor: string): ActivityActionResult {
  return updateActivity(storage, activityId, (activity) => {
    const index = activity.observations.findIndex((observation) => observation.id === observationId);
    if (index < 0) return "La observación no existe.";
    const target = activity.observations[index];
    if (target.resolvedAt) return "Una observación resuelta ya no se puede eliminar.";
    const now = new Date().toISOString();
    if (field === "response") {
      if (!target.response) return "No existe una respuesta para eliminar.";
      const edited = { ...target, response: undefined, respondedBy: undefined, respondedAt: undefined, responseDeletedBy: actor, responseDeletedAt: now };
      return { ...activity, observations: activity.observations.map((item, itemIndex) => itemIndex === index ? edited : item), updatedAt: now };
    }
    if (!activity.preObservationStatus) return "No se conoce el estado anterior de la actividad.";
    const withdrawn = { ...target, deletedBy: actor, deletedAt: now, resolvedBy: actor, resolvedAt: now };
    const restored = withStatus(activity, activity.preObservationStatus, actor, now);
    return { ...restored, preObservationStatus: undefined, observations: activity.observations.map((item, itemIndex) => itemIndex === index ? withdrawn : item) };
  });
}

export function resolveObservation(storage: Pick<Storage, "getItem" | "setItem">, id: string, actor: string): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    const open = activity.observations.findIndex((observation) => !observation.resolvedAt);
    if (activity.status !== "Observada" || open < 0) return "Esta actividad no tiene una observación abierta.";
    if (!activity.observations[open].response) return "El colaborador todavía no respondió la observación.";
    if (!activity.preObservationStatus) return "No se conoce el estado al que debe regresar la actividad.";
    const now = new Date().toISOString();
    const observations = activity.observations.map((observation, index) => index === open ? { ...observation, resolvedBy: actor, resolvedAt: now } : observation);
    return { ...withStatus(activity, activity.preObservationStatus, actor, now), preObservationStatus: undefined, observations };
  });
}

export function approveActivity(storage: Pick<Storage, "getItem" | "setItem">, id: string, actor: string): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    if (activity.status !== "Entregada") return "Solo se puede aprobar una actividad entregada.";
    if (activity.observations.some((observation) => !observation.resolvedAt)) return "Resuelve las observaciones abiertas antes de aprobar.";
    return withStatus(activity, "Aprobada", actor, new Date().toISOString());
  });
}

export function cancelActivity(storage: Pick<Storage, "getItem" | "setItem">, id: string, actor: string): ActivityActionResult {
  return updateActivity(storage, id, (activity) => {
    if (activity.status === "Aprobada") return "Una actividad aprobada no se puede cancelar.";
    if (activity.status === "Cancelada") return "La actividad ya está cancelada.";
    return withStatus(activity, "Cancelada", actor, new Date().toISOString());
  });
}

export function useSimulatedActivities() {
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => { if (event.key === activityStoreKey) notify(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener(activityStoreEvent, notify);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(activityStoreEvent, notify); };
  }, []);
  const getSnapshot = useCallback(() => window.localStorage.getItem(activityStoreKey) ?? seedSnapshot, []);
  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  return useMemo(() => parseActivityStore(raw), [raw]);
}

export function useActivityStoreHealth() {
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => { if (event.key === activityStoreKey) notify(); };
    window.addEventListener("storage", onStorage); window.addEventListener(activityStoreEvent, notify);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(activityStoreEvent, notify); };
  }, []);
  const snapshot = useCallback(() => window.localStorage.getItem(activityStoreKey), []);
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  return { corrupt: activityStoreIsCorrupt(raw) };
}
