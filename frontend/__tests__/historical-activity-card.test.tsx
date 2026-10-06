import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { DetailPanel, type DetailActivity } from "@/components/calendar-detail-panel";

const item: DetailActivity = {
  id: "card-synthetic", type: "Grabación", title: "Charla de demostración",
  responsible: "Operario ficticio", place: "Sede de prueba", status: "Entregada",
  spans: [{ start: "2026-04-27", end: "2026-04-27", place: "Sede de prueba" }],
  description: "Descripción completa conservada en el detalle.", materialLink: "",
  classification: "special", recordingModes: ["Fotografía", "Video", "Vuelo con dron"],
};

it("agrupa modalidades y Especial, no muestra descripción y mantiene detalle/retorno", () => {
  const onChoose = vi.fn();
  render(<DetailPanel item={item} choices={[item]} onChoose={onChoose} titleId="panel" today="2026-04-27" />);
  const card = screen.getByRole("article");
  const attributes = within(card).getByRole("list", { name: "Características de la actividad" });
  expect(within(attributes).getAllByRole("listitem").map(li => li.textContent)).toEqual(["Fotografía", "Video", "Vuelo con dron", "Especial"]);
  expect(within(attributes).getAllByRole("listitem").every(li => li.querySelector('svg[aria-hidden="true"]'))).toBe(true);
  expect(within(card).queryByText(item.description)).toBeNull();
  expect(within(card).queryByText("Estándar")).toBeNull();
  expect(within(card).getByText("Entregada").className).toContain("bg-delivered-special");
  const button = within(card).getByRole("button", { name: /Ver detalles:/ });
  fireEvent.click(button);
  expect(onChoose).toHaveBeenCalledWith(item);
  expect(screen.getByText(item.description)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Volver a las actividades del día" }));
  expect(screen.queryByText(item.description)).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: /Ver detalles:/ }));
});

it("mantiene responsable y opinión fuera de la vista de Aunor", () => {
  render(<DetailPanel item={item} choices={[item]} onChoose={vi.fn()} titleId="client" today="2026-04-27" clientView />);
  expect(screen.queryByText(item.responsible!)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Ver detalles:/ }));
  expect(screen.queryByText(item.responsible!)).toBeNull();
  expect(screen.queryByText("Opinión del operario")).toBeNull();
  expect(screen.getByText(item.description)).toBeTruthy();
});

it.each([undefined, null, "standard"] as const)("una edición con clasificación %s no inventa modalidades ni un tag estándar", classification => {
  const edition = { ...item, type: "Edición" as const, recordingModes: [], classification };
  render(<DetailPanel item={edition} choices={[edition]} onChoose={vi.fn()} titleId="edition" today="2026-04-27" />);
  expect(screen.queryByRole("list", { name: "Características de la actividad" })).toBeNull();
  expect(screen.getByText("Entregada").className).toContain("bg-delivered ");
  expect(screen.getByRole("button", { name: /Ver detalles:/ })).toBeTruthy();
});
