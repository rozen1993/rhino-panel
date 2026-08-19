import { describe, expect, it } from "vitest";
import { advanceActivity, approveActivity, cancelActivity, deleteObservationText, editObservationText, nextActivityStatus, observeActivity, readActivities, resolveObservation, respondToObservation, upsertActivity } from "@/lib/activity-simulation";
import type { ActivityDraftFields } from "@/lib/activity-draft";
import { roles } from "@/lib/roles";

const fields: ActivityDraftFields = {
  date: "2026-08-18T10:00", type: "Grabación", title: "Nueva cobertura", responsible: "Grabación",
  status: "Programada", progress: "0%", placeName: "Peaje", placeReference: "", placeKm: "",
  placeDirection: "", placeLatitude: "", placeLongitude: "", description: "Prueba", deliveryDate: "",
  materialLink: "", notes: "",
};

describe("simulación de actividades", () => {
  it("guarda una actividad y luego permite editarla sin duplicarla", () => {
    const created = upsertActivity(localStorage, fields, roles.grabacion);
    upsertActivity(localStorage, { ...fields, title: "Cobertura editada" }, roles.grabacion, created.id);
    const matches = readActivities(localStorage).filter((item) => item.id === created.id);
    expect(matches).toHaveLength(1);
    expect(matches[0].title).toBe("Cobertura editada");
  });

  it("avanza el estado y registra el historial", () => {
    const created = upsertActivity(localStorage, fields, roles.grabacion);
    const advanced = advanceActivity(localStorage, created.id, "Grabación");
    expect(advanced?.status).toBe("En proceso");
    expect(advanced?.history[0]).toMatchObject({ status: "En proceso", actor: "Grabación" });
  });

  it("omite Por subir para Coordinación", () => {
    expect(nextActivityStatus("Coordinación", "En proceso")).toBe("Entregada");
    expect(nextActivityStatus("Grabación", "En proceso")).toBe("Por subir");
    expect(nextActivityStatus("Grabación", "Entregada")).toBeNull();
  });

  it("observa, recibe respuesta y vuelve exactamente al estado anterior", () => {
    const created = upsertActivity(localStorage, { ...fields, status: "En proceso" }, roles.grabacion);
    expect(observeActivity(localStorage, created.id, "Corrige el audio", "Supervisión").ok).toBe(true);
    expect(readActivities(localStorage).find((item) => item.id === created.id)?.preObservationStatus).toBe("En proceso");
    expect(resolveObservation(localStorage, created.id, "Supervisión")).toMatchObject({ ok: false });
    expect(respondToObservation(localStorage, created.id, "Audio corregido", "Grabación").ok).toBe(true);
    const resolved = resolveObservation(localStorage, created.id, "Supervisión");
    expect(resolved.ok && resolved.activity.status).toBe("En proceso");
    expect(resolved.ok && resolved.activity.observations[0].resolvedBy).toBe("Supervisión");
  });

  it("solo aprueba entregadas y nunca cancela una aprobada", () => {
    const created = upsertActivity(localStorage, { ...fields, status: "En proceso" }, roles.grabacion);
    expect(approveActivity(localStorage, created.id, "Supervisión")).toMatchObject({ ok: false });
    const delivered = upsertActivity(localStorage, { ...fields, status: "Entregada" }, roles.grabacion, created.id);
    expect(approveActivity(localStorage, delivered.id, "Supervisión").ok).toBe(true);
    expect(cancelActivity(localStorage, delivered.id, "Supervisión")).toMatchObject({ ok: false });
  });

  it("edita mensajes abiertos con trazabilidad pero bloquea los resueltos", () => {
    const created = upsertActivity(localStorage, { ...fields, status: "En proceso" }, roles.grabacion);
    const observed = observeActivity(localStorage, created.id, "Texto con eror", "Supervisión");
    if (!observed.ok) throw new Error(observed.error);
    const observationId = observed.activity.observations[0].id;
    const edited = editObservationText(localStorage, created.id, observationId, "message", "Texto sin error", "Supervisión");
    expect(edited.ok && edited.activity.observations[0].messageEditedAt).toBeTruthy();
    respondToObservation(localStorage, created.id, "Respuesta con eror", "Grabación");
    expect(editObservationText(localStorage, created.id, observationId, "response", "Respuesta corregida", "Grabación").ok).toBe(true);
    resolveObservation(localStorage, created.id, "Supervisión");
    expect(editObservationText(localStorage, created.id, observationId, "message", "Cambio tardío", "Supervisión")).toMatchObject({ ok: false });
  });

  it("elimina una respuesta y permite reemplazarla", () => {
    const created = upsertActivity(localStorage, { ...fields, status: "Por subir" }, roles.grabacion);
    const observed = observeActivity(localStorage, created.id, "Revisa el material", "Supervisión");
    if (!observed.ok) throw new Error(observed.error);
    const observationId = observed.activity.observations[0].id;
    respondToObservation(localStorage, created.id, "Primera respuesta", "Grabación");
    const removed = deleteObservationText(localStorage, created.id, observationId, "response", "Grabación");
    expect(removed.ok && removed.activity.observations[0].response).toBeUndefined();
    expect(respondToObservation(localStorage, created.id, "Respuesta definitiva", "Grabación").ok).toBe(true);
  });

  it("retira una observación y restaura el estado anterior", () => {
    const created = upsertActivity(localStorage, { ...fields, status: "Entregada" }, roles.grabacion);
    const observed = observeActivity(localStorage, created.id, "Observación equivocada", "Supervisión");
    if (!observed.ok) throw new Error(observed.error);
    const removed = deleteObservationText(localStorage, created.id, observed.activity.observations[0].id, "message", "Supervisión");
    expect(removed.ok && removed.activity.status).toBe("Entregada");
    expect(removed.ok && removed.activity.observations[0].deletedAt).toBeTruthy();
  });
});
