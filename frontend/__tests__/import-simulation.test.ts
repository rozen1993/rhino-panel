import { describe, expect, it } from "vitest";
import { importSimulation } from "@/lib/import-simulation";

describe("simulación de importación", () => {
  it("separa todas las filas y explica cada rechazo", () => {
    expect(importSimulation.accepted).toHaveLength(3);
    expect(importSimulation.rejected).toHaveLength(2);
    expect(importSimulation.rejected.every((row) => row.reason.length > 0)).toBe(true);
  });
});
