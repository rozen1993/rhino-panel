import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityHistory } from "@/components/activity-history";
import { upsertActivity } from "@/lib/activity-simulation";
import type { ActivityDraftFields } from "@/lib/activity-draft";
import { roles } from "@/lib/roles";

describe("historial dinámico", () => {
  it("busca y filtra las actividades visibles", () => {
    render(<ActivityHistory role={roles.supervision} />);
    expect(screen.getByText("5 resultados")).toBeDefined();
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar actividad" }), { target: { value: "locución" } });
    expect(screen.getByText("1 resultados")).toBeDefined();
    expect(screen.getByText("Locución para spot de seguridad vial")).toBeDefined();
  });

  it("pagina cuando existen más de cuatro resultados", () => {
    render(<ActivityHistory role={roles.supervision} />);
    expect(screen.getByText("Página 1 de 2")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("Página 2 de 2")).toBeDefined();
  });

  it("limita un rol operativo a su propio tipo", () => {
    render(<ActivityHistory role={roles.grabacion} />);
    expect(screen.getByText("1 resultados")).toBeDefined();
    expect(screen.getByText("Cobertura de mantenimiento en peaje Chillón")).toBeDefined();
    expect(screen.queryByText("Resumen semanal de seguridad vial")).toBeNull();
  });

  it("mantiene las actividades canceladas en el historial", () => {
    const fields: ActivityDraftFields = { date: "2026-08-19T12:00", type: "Grabación", title: "Actividad cancelada visible", responsible: "Grabación", status: "Cancelada", progress: "0%", placeName: "Peaje", placeReference: "", placeKm: "", placeDirection: "", placeLatitude: "", placeLongitude: "", description: "", deliveryDate: "", materialLink: "", notes: "" };
    upsertActivity(localStorage, fields, roles.grabacion);
    render(<ActivityHistory role={roles.supervision} />);
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "Cancelada" } });
    expect(screen.getByText("Actividad cancelada visible")).toBeDefined();
  });
});
