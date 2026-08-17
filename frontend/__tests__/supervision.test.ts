import { describe, expect, it } from "vitest";
import { internalStatuses } from "@/components/status-pill";
import { getSupervisionActions } from "@/lib/supervision";

describe("acciones de supervisión", () => {
  it("solo permite aprobar una actividad entregada", () => {
    internalStatuses.forEach((status) => {
      expect(getSupervisionActions(status).includes("Aprobar")).toBe(status === "Entregada");
    });
  });

  it("nunca ofrece aprobar ni observar una actividad observada", () => {
    expect(getSupervisionActions("Observada")).toEqual(["Cancelar"]);
  });
});
