import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SupabaseAccessPage } from "../app/acceso/supabase-access";
vi.mock("@/app/acceso/login-form", () => ({ LoginForm: ({ initialUser }: { initialUser?: string }) => <input aria-label="Usuario" defaultValue={initialUser} /> }));
afterEach(cleanup);
const entries = [{ username: "cesar", display_name: "Cesar", role: "operario" }, { username: "aunor", display_name: "Aunor", role: "aunor" }];
it("muestra cuentas reales sin inventar métricas", () => {
  render(<SupabaseAccessPage entries={entries} month="septiembre de 2026" />);
  expect(screen.getByRole("button", { name: "Ingresar como Cesar" })).toBeTruthy();
  expect(screen.getAllByText("Activo")).toHaveLength(2);
  expect(screen.queryByText("Carlos Vega")).toBeNull();
});
it("precarga el usuario sin conceder permisos por el rol seleccionado", () => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  render(<SupabaseAccessPage entries={entries} month="septiembre de 2026" />);
  fireEvent.click(screen.getByRole("button", { name: "Ingresar como Aunor" }));
  expect((screen.getByLabelText("Usuario") as HTMLInputElement).value).toBe("aunor");
  expect(document.querySelector('input[name="role"]')).toBeNull();
});
it("permite acceso manual si falla el directorio", () => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  render(<SupabaseAccessPage entries={[]} month="septiembre de 2026" />);
  expect(screen.getByRole("status")).toBeTruthy();
  fireEvent.click(screen.getByText("Ingresar con otro usuario"));
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
});
