import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityHistory } from "@/components/activity-history";
import { roles } from "@/lib/roles";

describe("historial dinamico", () => {
  it("busca y filtra las actividades visibles", () => { render(<ActivityHistory role={roles.supervision} />); expect(screen.getByText("4 resultados")).toBeDefined(); fireEvent.change(screen.getByRole("searchbox", { name: "Buscar actividad" }), { target: { value: "locucion" } }); expect(screen.getByText("1 resultados")).toBeDefined(); });
  it("limita una cuenta operativa a sus ordenes asignadas", () => { render(<ActivityHistory role={{ ...roles.grabacion, accountId: "test-grabacion" }} />); expect(screen.getByText("1 resultados")).toBeDefined(); expect(screen.getByText("Cobertura de mantenimiento en peaje Chillon")).toBeDefined(); expect(screen.queryByText("Resumen semanal de seguridad vial")).toBeNull(); });
});
