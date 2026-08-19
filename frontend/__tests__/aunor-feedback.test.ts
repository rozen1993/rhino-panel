import { describe, expect, it } from "vitest";
import { deleteAunorFeedback, editAunorFeedback, handleAunorFeedback, readAunorFeedback, submitAunorFeedback } from "@/lib/aunor-feedback";
import { projectActivityForAunor } from "@/lib/aunor";
import { readActivities } from "@/lib/activity-simulation";

describe("frontera y feedback de AUNOR", () => {
  it("proyecta solo campos autorizados y oculta canceladas", () => {
    const activities = readActivities(localStorage);
    const visible = activities.map(projectActivityForAunor).filter((item) => item !== null);
    expect(visible.some((item) => item.status === "En trabajo")).toBe(true);
    expect(visible.some((item) => item.status === "Cancelada")).toBe(false);
    const serialized = JSON.stringify(visible);
    ["observations", "history", "description", "responsible", "materialLink", "createdBy"].forEach((field) => expect(serialized).not.toContain(`\"${field}\"`));
  });

  it("envía feedback sin cambiar el estado de la actividad", () => {
    const before = readActivities(localStorage).find((item) => item.id === "peaje-chillon")?.status;
    const result = submitAunorFeedback(localStorage, "peaje-chillon", "Necesitamos una toma general");
    expect(result.ok).toBe(true);
    expect(readActivities(localStorage).find((item) => item.id === "peaje-chillon")?.status).toBe(before);
    expect(readAunorFeedback(localStorage)[0].status).toBe("pending");
  });

  it("permite responder o descartar una sola vez", () => {
    const created = submitAunorFeedback(localStorage, "peaje-chillon", "¿Está confirmado?");
    if (!created.ok) throw new Error(created.error);
    expect(handleAunorFeedback(localStorage, created.feedback.id, "responded", "Supervisión", "Sí, confirmado.").ok).toBe(true);
    expect(handleAunorFeedback(localStorage, created.feedback.id, "discarded", "Supervisión")).toMatchObject({ ok: false });
    expect(readAunorFeedback(localStorage).find((item) => item.id === created.feedback.id)?.response).toBe("Sí, confirmado.");
  });

  it("permite corregir una opinión pendiente y una respuesta enviada", () => {
    const created = submitAunorFeedback(localStorage, "peaje-chillon", "Texto con eror");
    if (!created.ok) throw new Error(created.error);
    expect(editAunorFeedback(localStorage, created.feedback.id, "text", "Texto corregido", "AUNOR").ok).toBe(true);
    handleAunorFeedback(localStorage, created.feedback.id, "responded", "Supervisión", "Respuesta con eror");
    expect(editAunorFeedback(localStorage, created.feedback.id, "text", "Cambio tardío", "AUNOR")).toMatchObject({ ok: false });
    expect(editAunorFeedback(localStorage, created.feedback.id, "response", "Respuesta corregida", "Supervisión").ok).toBe(true);
    const saved = readAunorFeedback(localStorage).find((item) => item.id === created.feedback.id)!;
    expect(saved.responseEditedAt).toBeTruthy();
  });

  it("elimina opiniones pendientes y devuelve respuestas eliminadas a la bandeja", () => {
    const first = submitAunorFeedback(localStorage, "peaje-chillon", "Mensaje accidental");
    if (!first.ok) throw new Error(first.error);
    expect(deleteAunorFeedback(localStorage, first.feedback.id, "text", "AUNOR").ok).toBe(true);
    expect(readAunorFeedback(localStorage).find((item) => item.id === first.feedback.id)?.deletedAt).toBeTruthy();
    const second = submitAunorFeedback(localStorage, "peaje-chillon", "Consulta válida");
    if (!second.ok) throw new Error(second.error);
    handleAunorFeedback(localStorage, second.feedback.id, "responded", "Supervisión", "Respuesta accidental");
    expect(deleteAunorFeedback(localStorage, second.feedback.id, "response", "Supervisión").ok).toBe(true);
    const restored = readAunorFeedback(localStorage).find((item) => item.id === second.feedback.id);
    expect(restored?.status).toBe("pending");
    expect(restored?.response).toBeUndefined();
  });
});
