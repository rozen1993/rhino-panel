"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export const aunorFeedbackKey = "rhino:feedback-aunor:v1";
const changedEvent = "rhino:feedback-aunor-cambio";
export type AunorFeedbackStatus = "pending" | "responded" | "discarded" | "converted";
export type AunorFeedback = { id: string; activityId: string; text: string; createdAt: string; status: AunorFeedbackStatus; response?: string; handledAt?: string; handledBy?: string; textEditedAt?: string; responseEditedAt?: string; responseEditedBy?: string; deletedAt?: string; deletedBy?: string; responseDeletedAt?: string; responseDeletedBy?: string };

const seed: AunorFeedback[] = [{ id: "feedback-cuadrilla", activityId: "agenda-cuadrilla-norte", text: "¿Podrían confirmar si la cuadrilla llegará antes del cierre de vía?", createdAt: "2026-08-16T17:40:00-05:00", status: "pending" }];
const seedSnapshot = JSON.stringify(seed);
const serverSnapshot = () => seedSnapshot;

export function parseAunorFeedback(raw: string | null): AunorFeedback[] {
  if (!raw) return seed;
  try { const value: unknown = JSON.parse(raw); return Array.isArray(value) ? value as AunorFeedback[] : seed; } catch { return seed; }
}

export function readAunorFeedback(storage: Pick<Storage, "getItem">) { return parseAunorFeedback(storage.getItem(aunorFeedbackKey)); }
function save(storage: Pick<Storage, "setItem">, value: AunorFeedback[]) { storage.setItem(aunorFeedbackKey, JSON.stringify(value)); window.dispatchEvent(new Event(changedEvent)); }

export function submitAunorFeedback(storage: Pick<Storage, "getItem" | "setItem">, activityId: string, text: string) {
  if (!text.trim()) return { ok: false as const, error: "Escribe una opinión antes de enviarla." };
  const item: AunorFeedback = { id: `feedback-${Date.now().toString(36)}`, activityId, text: text.trim(), createdAt: new Date().toISOString(), status: "pending" };
  save(storage, [item, ...readAunorFeedback(storage)]);
  return { ok: true as const, feedback: item };
}

export function handleAunorFeedback(storage: Pick<Storage, "getItem" | "setItem">, id: string, status: Exclude<AunorFeedbackStatus, "pending">, actor: string, response?: string) {
  const current = readAunorFeedback(storage); const item = current.find((feedback) => feedback.id === id);
  if (!item || item.deletedAt || item.status !== "pending") return { ok: false as const, error: "Este feedback ya fue atendido o no existe." };
  if (status === "responded" && !response?.trim()) return { ok: false as const, error: "Escribe una respuesta para AUNOR." };
  const next = { ...item, status, response: response?.trim(), handledAt: new Date().toISOString(), handledBy: actor };
  save(storage, current.map((feedback) => feedback.id === id ? next : feedback));
  return { ok: true as const, feedback: next };
}

export function editAunorFeedback(storage: Pick<Storage, "getItem" | "setItem">, id: string, field: "text" | "response", text: string, actor: string) {
  const current = readAunorFeedback(storage); const item = current.find((feedback) => feedback.id === id);
  if (!item) return { ok: false as const, error: "El mensaje no existe." };
  if (!text.trim()) return { ok: false as const, error: "El mensaje no puede quedar vacío." };
  if (field === "text" && item.status !== "pending") return { ok: false as const, error: "Una opinión atendida ya no se puede editar." };
  if (field === "response" && (item.status !== "responded" || !item.response)) return { ok: false as const, error: "No hay una respuesta editable." };
  const now = new Date().toISOString();
  const next = field === "text" ? { ...item, text: text.trim(), textEditedAt: now } : { ...item, response: text.trim(), responseEditedAt: now, responseEditedBy: actor };
  save(storage, current.map((feedback) => feedback.id === id ? next : feedback));
  return { ok: true as const, feedback: next };
}

export function deleteAunorFeedback(storage: Pick<Storage, "getItem" | "setItem">, id: string, field: "text" | "response", actor: string) {
  const current = readAunorFeedback(storage); const item = current.find((feedback) => feedback.id === id);
  if (!item) return { ok: false as const, error: "El mensaje no existe." };
  const now = new Date().toISOString();
  if (field === "text") {
    if (item.status !== "pending" || item.deletedAt) return { ok: false as const, error: "Una opinión atendida ya no se puede eliminar." };
    const next = { ...item, deletedAt: now, deletedBy: actor };
    save(storage, current.map((feedback) => feedback.id === id ? next : feedback));
    return { ok: true as const, feedback: next };
  }
  if (item.status !== "responded" || !item.response) return { ok: false as const, error: "No hay una respuesta para eliminar." };
  const next = { ...item, status: "pending" as const, response: undefined, responseDeletedAt: now, responseDeletedBy: actor, handledAt: undefined, handledBy: undefined };
  save(storage, current.map((feedback) => feedback.id === id ? next : feedback));
  return { ok: true as const, feedback: next };
}

export function useAunorFeedback() {
  const subscribe = useCallback((notify: () => void) => { const storage = (event: StorageEvent) => { if (event.key === aunorFeedbackKey) notify(); }; window.addEventListener("storage", storage); window.addEventListener(changedEvent, notify); return () => { window.removeEventListener("storage", storage); window.removeEventListener(changedEvent, notify); }; }, []);
  const snapshot = useCallback(() => window.localStorage.getItem(aunorFeedbackKey) ?? seedSnapshot, []);
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => parseAunorFeedback(raw), [raw]);
}
