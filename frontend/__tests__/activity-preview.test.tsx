import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ActivityPreview } from "@/components/activity-preview";
import type { Activity } from "@/lib/activities";

const item: Activity = {
  id: "preview-example", type: "Grabación", title: "Charla de prueba",
  responsible: "Operario ficticio", responsibleAccountId: "test-account", status: "Entregada",
  origin: "operario", classification: "standard", spans: [{start:"2026-04-27",end:"2026-04-27"}],
  description: "Descripción sintética", place: "Sede ficticia", materialLink: "https://example.invalid/material", operatorOpinion: "Opinión de ejemplo",
};
const returnTo = "/actividades?periodo=2026-04";

it.each(["standard", "special"] as const)("vista %s: fecha, responsable, opinión, estado y enlaces seguros", classification => {
  const {container} = render(<ActivityPreview item={{...item,classification}} returnTo={returnTo}/>);
  expect(container.querySelector("time")?.getAttribute("datetime")).toBe("2026-04-27");
  expect(screen.getByLabelText("27 de abril de 2026")).toBeTruthy();
  expect(screen.getByText(item.responsible)).toBeTruthy();
  expect(screen.getByText(item.operatorOpinion)).toBeTruthy();
  expect(screen.queryByText("Estándar")).toBeNull();
  expect(Boolean(screen.queryByRole("img", {name:"Actividad especial"}))).toBe(classification === "special");
  expect(container.querySelector("[data-activity-preview]")?.className.includes("special")).toBe(classification === "special");
  expect(screen.getByText("Entregada").getAttribute("data-compact")).toBeNull();
  expect(screen.getByRole("link",{name:"Abrir ficha completa"}).getAttribute("href")).toBe(`/actividades/${item.id}?volver=${encodeURIComponent(returnTo)}`);
  expect(screen.getByRole("link",{name:"Abrir material"}).getAttribute("rel")).toBe("noreferrer");
});

it("usa la fecha de entrega de edición antes que jornadas antiguas", () => {
  const {container} = render(<ActivityPreview item={{...item,type:"Edición",deliveryDueOn:"2026-05-04"}} returnTo={returnTo}/>);
  expect(container.querySelector("time")?.getAttribute("datetime")).toBe("2026-05-04");
  expect(screen.getByText("Entrega prevista")).toBeTruthy();
  expect(screen.queryByText("Primera jornada")).toBeNull();
});

it("no oculta jornadas adicionales ni el año en rangos", () => {
  render(<ActivityPreview item={{...item,spans:[{start:"2027-01-02",end:"2027-01-03"},{start:"2026-12-30",end:"2026-12-31"}]}} returnTo={returnTo}/>);
  expect(screen.getByLabelText("30 de diciembre de 2026")).toBeTruthy();
  expect(screen.getByText("Primera jornada")).toBeTruthy();
  expect(screen.getByText(/2 ene.*3 ene.*2027.*30 dic.*31 dic.*2026/)).toBeTruthy();
});

it.each(["", "javascript:alert(1)"])("no inventa material ni fechas si faltan: %s", materialLink => {
  render(<ActivityPreview item={{...item,spans:[],materialLink}} returnTo={returnTo}/>);
  expect(screen.getByText("Sin fecha")).toBeTruthy();
  expect(screen.queryByRole("link",{name:"Abrir material"})).toBeNull();
});

it("permite una selección vacía sin simular datos", () => {
  render(<ActivityPreview item={undefined} returnTo={returnTo}/>);
  expect(screen.getByText("Selecciona una actividad para ver su detalle.")).toBeTruthy();
  expect(screen.queryByRole("link")).toBeNull();
});
