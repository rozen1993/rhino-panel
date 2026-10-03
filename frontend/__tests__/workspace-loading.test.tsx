import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { WorkspaceLoading } from "@/components/workspace-loading";

it("renders anticipated structure 01 with an accessible, indeterminate status", () => {
  render(<WorkspaceLoading label="Abriendo tu contrato" section="Contrato" description="Estamos consultando los trabajos y las metas."/>);
  const status = screen.getByRole("status", { name: "Abriendo tu contrato" });
  expect(status.getAttribute("aria-busy")).toBe("true");
  expect(screen.queryByRole("heading")).toBeNull();
  const skeleton = status.querySelector('[data-loading-skeleton="cards"]');
  expect(skeleton?.getAttribute("aria-hidden")).toBe("true");
  expect(skeleton?.children).toHaveLength(6);
  expect(status.textContent).toContain("Puedes seguir usando el menú.");
  expect(status.textContent).toContain("Estamos consultando los trabajos y las metas.");
  expect(status.textContent).not.toContain("%");
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(status.querySelector("button, a, input, img")).toBeNull();
});

it("keeps the neutral fallback free of account identity", () => {
  render(<WorkspaceLoading/>);
  const status = screen.getByRole("status", { name: "Abriendo tu espacio" });
  expect(status.textContent).toContain("Control de actividades");
  expect(status.textContent).not.toMatch(/Admin|Aunor|Operario/);
});
