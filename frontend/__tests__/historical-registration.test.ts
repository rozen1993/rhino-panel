import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  historicalRegistrationError,
  historicalPreview,
  type HistoricalRegistration,
} from "@/lib/historical-registration";
import { createAunorExamples } from "@/lib/aunor-examples";
import { registerDemoHistorical, readDemoAunor } from "@/lib/aunor-demo.server";
import { roles } from "@/lib/roles";
import { safeActivityReturn } from "@/lib/dashboard-navigation";
vi.mock("server-only", () => ({}));
const admin = {
  ...roles.admin,
  accountId: "account-admin",
  accountName: "Admin",
};
export const fixture = (): HistoricalRegistration => ({
  type: "Grabación",
  title: "Registro sintético",
  description: "Descripción de prueba",
  placeName: "Lugar",
  spans: [{ start: "2026-04-17", end: "2026-04-17" }],
  recordingModes: ["Video"],
  classification: "standard",
  responsibleAccountId: "account-ana",
  materialLink: "https://example.invalid/material",
  serviceId: "cobertura",
  confirmed: true,
  notes: "",
  referenceLink: "",
});
beforeEach(() => {
  delete (globalThis as { __sistemaRAunorDemo?: unknown }).__sistemaRAunorDemo;
});
describe("registro histórico terminado", () => {
  it.each(["Grabación", "Locución", "Creatividad", "Edición"] as const)(
    "una referencia de fecha en %s",
    (type) => {
      const p = {
        ...fixture(),
        type,
        recordingModes: type === "Grabación" ? ["Video" as const] : [],
        ...(type === "Edición"
          ? {
              deliveryDueOn: "2026-04-17",
              spans: [],
              description: "",
              placeName: "",
            }
          : {}),
      };
      expect(historicalRegistrationError(p, "2026-09-30")).toBeNull();
    },
  );
  it("rechaza otra entrega para no Edición, material inseguro, falta de confirmación y fechas futuras", () => {
    for (const patch of [
      { deliveryDueOn: "2026-04-19" },
      { materialLink: "http://example.invalid" },
      { confirmed: false },
      { classification: null },
      { spans: [{ start: "2026-09-30", end: "2026-09-30" }] },
    ])
      expect(
        historicalRegistrationError({ ...fixture(), ...patch }, "2026-09-30"),
      ).toBeTruthy();
  });
  it("aplica el mismo conteo y no altera datos en la vista previa", () => {
    const w = createAunorExamples(),
      before = JSON.stringify(w),
      p = fixture();
    const preview = historicalPreview(w, p);
    expect(preview).toMatchObject({
      delta: 1,
      target: 10,
      label: { starts_on: "2026-04-01" },
    });
    expect(
      historicalPreview(w, {
        ...p,
        spans: [{ start: "2026-04-29", end: "2026-05-02" }],
      }),
    ).toBeNull();
    expect(JSON.stringify(w)).toBe(before);
  });
  it("demo registra una vez, publica en contrato y no inventa una hora de entrega", () => {
    const p = fixture(),
      key = crypto.randomUUID(),
      a = registerDemoHistorical(admin, p, key, "Operario");
    expect(a.status).toBe("Entregada");
    expect(a.deliveredAt).toBeUndefined();
    expect(a.spans[0].start).toBe("2026-04-17");
    expect(registerDemoHistorical(admin, p, key, "Operario").id).toBe(a.id);
    expect(
      readDemoAunor(admin).activities.filter((row) => row.id === a.id),
    ).toHaveLength(1);
    expect(() =>
      registerDemoHistorical(
        admin,
        { ...p, title: "Reintento cambiado" },
        key,
        "Operario",
      ),
    ).toThrow();
  });
  it("rechaza roles no autorizados y revierte una relación inválida sin dejar filas", () => {
    expect(() =>
      registerDemoHistorical(
        roles.operario,
        fixture(),
        crypto.randomUUID(),
        "Operario",
      ),
    ).toThrow();
    const before = JSON.stringify(readDemoAunor(admin));
    expect(() =>
      registerDemoHistorical(
        admin,
        { ...fixture(), serviceId: "no-service" },
        crypto.randomUUID(),
        "Operario",
      ),
    ).toThrow();
    expect(JSON.stringify(readDemoAunor(admin))).toBe(before);
  });
  it("el regreso al contrato es local, por mes y solo para Admin", () => {
    expect(safeActivityReturn("/contrato?mes=2026-04", true)).toBe(
      "/contrato?mes=2026-04",
    );
    expect(safeActivityReturn("/contrato?mes=2026-04", false)).toBe(
      "/actividades",
    );
    expect(
      safeActivityReturn("https://evil.invalid/contrato?mes=2026-04", true),
    ).toBe("/actividades");
  });
});
