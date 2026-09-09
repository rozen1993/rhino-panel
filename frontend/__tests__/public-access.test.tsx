import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SupabaseAccessPage } from "../app/acceso/supabase-access";

vi.mock("@/app/acceso/login-form", () => ({ LoginForm: () => <form aria-label="Autenticación real" /> }));
afterEach(cleanup);

it("muestra los tres accesos sin publicar cuentas o datos operativos", () => {
  render(<SupabaseAccessPage />);
  for (const role of ["Admin", "Operario", "Aunor"]) expect(screen.getByRole("button", { name: `Ingresar como ${role}` })).toBeTruthy();
  expect(screen.queryByText("Carlos Vega")).toBeNull();
  expect(screen.queryByText("Activo")).toBeNull();
});

it("abre el formulario, sin enviar un rol que conceda permisos", () => {
  const showModal = vi.fn();
  HTMLDialogElement.prototype.showModal = showModal;
  render(<SupabaseAccessPage />);
  fireEvent.click(screen.getByRole("button", { name: "Ingresar como Aunor" }));
  expect(showModal).toHaveBeenCalledOnce();
  expect(screen.getByText("Acceso Aunor")).toBeTruthy();
  expect(document.querySelector('input[name="role"]')).toBeNull();
});
