import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ActivityDetail } from "@/components/activity-detail";
import { parseActivityStore, type SimulatedActivity } from "@/lib/activity-simulation";
import { roles } from "@/lib/roles";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), ownDelete: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("@/app/actividades/actions", () => ({
  advanceSupabaseActivityAction: vi.fn(),
  resetSupabaseActivityAction: vi.fn(),
  deleteSupabaseActivityMessageAction: vi.fn(),
  editSupabaseActivityMessageAction: vi.fn(),
  postSupabaseActivityMessageAction: vi.fn(),
}));
vi.mock("@/app/papelera/actions", () => ({ softDeleteSupabaseActivityAction: vi.fn(), softDeleteOwnSupabaseActivityAction: mocks.ownDelete }));
vi.mock("@/components/admin-aunor-panel", () => ({ AdminAunorPanel: () => null }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

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

const creatorRole = { ...roles.operario, accountId: "creator", canCreateOwnActivities: true };
function ownActivity(patch: Partial<SimulatedActivity> = {}) {
  return { ...activity("Programada"), createdByAccountId: "creator", createdByRoleId: "operario" as const, responsibleAccountId: "creator", ...patch };
}
function renderOwn(patch: Partial<SimulatedActivity> = {}) {
  const item = ownActivity(patch);
  render(<ActivityDetail id={item.id} initialActivity={item} dataSource="supabase" role={creatorRole} />);
  return item;
}
it("centra la gestión propia sin incorporar los controles de Admin", () => {
  renderOwn();
  expect(screen.getByRole("link", { name: "Editar actividad" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Eliminar actividad" })).toBeTruthy();
  expect(screen.queryByText("Administrar registro")).toBeNull();
  expect(screen.queryByText("Restablecer a Programada")).toBeNull();
});
it.each([{ createdByRoleId: "admin" }, { createdByAccountId: "other" }, { status: "En proceso" }, { status: "Entregada" }] as Partial<SimulatedActivity>[])("no muestra gestión propia fuera de permiso: %j", patch => {
  renderOwn(patch);
  expect(screen.queryByRole("link", { name: "Editar actividad" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Eliminar actividad" })).toBeNull();
});
it("confirmar exige motivo, conserva errores y vuelve a actividades al terminar", async () => {
  // Native focus trap is verified in Chromium E2E; jsdom only opens the dialog.
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; } });
  const item = renderOwn();
  fireEvent.click(screen.getByRole("button", { name: "Eliminar actividad" }));
  expect(screen.getByRole("dialog", { name: "¿Enviar a Papelera?" })).toBeTruthy();
  expect((screen.getByRole("button", { name: "Enviar a Papelera" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Motivo de eliminación (obligatorio)"), { target: { value: "  Error de planificación  " } });
  mocks.ownDelete.mockResolvedValueOnce({ ok: false, error: "La actividad cambió; recarga." });
  fireEvent.click(screen.getByRole("button", { name: "Enviar a Papelera" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("La actividad cambió"));
  expect(mocks.push).not.toHaveBeenCalled();
  mocks.ownDelete.mockResolvedValueOnce({ ok: true });
  fireEvent.click(screen.getByRole("button", { name: "Enviar a Papelera" }));
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/actividades"));
  expect(mocks.ownDelete).toHaveBeenLastCalledWith(item.id, item.version, "Error de planificación");
  expect(mocks.push).not.toHaveBeenCalledWith("/papelera");
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});
