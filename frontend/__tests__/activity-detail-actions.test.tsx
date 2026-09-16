import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ActivityDetail } from "@/components/activity-detail";
import { parseActivityStore, type SimulatedActivity } from "@/lib/activity-simulation";
import { roles } from "@/lib/roles";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("@/app/actividades/actions", () => ({
  advanceSupabaseActivityAction: vi.fn(),
  resetSupabaseActivityAction: vi.fn(),
  deleteSupabaseActivityMessageAction: vi.fn(),
  editSupabaseActivityMessageAction: vi.fn(),
  postSupabaseActivityMessageAction: vi.fn(),
}));
vi.mock("@/app/papelera/actions", () => ({ softDeleteSupabaseActivityAction: vi.fn() }));
vi.mock("@/components/admin-aunor-panel", () => ({ AdminAunorPanel: () => null }));

afterEach(cleanup);

function activity(status: SimulatedActivity["status"], materialLink = ""): SimulatedActivity {
  const seed = parseActivityStore(null)[0];
  return { ...seed, status, materialLink, deliveredAt: status === "Entregada" ? seed.deliveredAt : undefined };
}

function renderOperator(item: SimulatedActivity) {
  render(<ActivityDetail id={item.id} initialActivity={item} dataSource="supabase"
    role={{ ...roles.operario, accountId: item.responsibleAccountId }} />);
}

it.each(["Programada", "En proceso"] as const)("ofrece entregar material sin enlace en %s", status => {
  const item = activity(status);
  renderOperator(item);
  expect(screen.getByRole("link", { name: "Entregar material" }).getAttribute("href"))
    .toBe(`/actividades/nueva?editar=${item.id}`);
  expect(screen.queryByRole("link", { name: "Actualizar entrega" })).toBeNull();
  expect(screen.getByRole("button", { name: status === "Programada" ? "Iniciar" : "Entregar" })).toBeTruthy();
});

it.each(["Programada", "En proceso", "Entregada"] as const)("ofrece actualizar el material existente en %s", status => {
  renderOperator(activity(status, "https://onedrive.live.com/material-prueba"));
  expect(screen.getByRole("link", { name: "Actualizar entrega" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Entregar material" })).toBeNull();
});

it("no considera los espacios como una entrega", () => {
  renderOperator(activity("Programada", "   "));
  expect(screen.getByRole("link", { name: "Entregar material" })).toBeTruthy();
});

it.each(["", "https://onedrive.live.com/material-prueba"])("conserva Editar plan para Admin con enlace %s", materialLink => {
  const item = activity("Programada", materialLink);
  render(<ActivityDetail id={item.id} initialActivity={item} dataSource="supabase" role={roles.admin} />);
  expect(screen.getByRole("link", { name: "Editar plan" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Entregar material" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Actualizar entrega" })).toBeNull();
});
