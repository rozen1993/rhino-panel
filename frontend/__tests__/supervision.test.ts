import { describe, expect, it } from "vitest";
import { internalStatuses } from "@/components/status-pill";
import { getSupervisionActions } from "@/lib/supervision";

describe("acciones de supervision", () => {
  it("solo evalua una actividad entregada", () => { internalStatuses.forEach((status) => expect(getSupervisionActions(status)).toEqual(status === "Entregada" ? ["Observar", "Rechazar", "Aprobar"] : [])); });
});
