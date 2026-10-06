import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StatusPill } from "@/components/status-pill";

it("representa Entregada con el petróleo compartido con Ver detalles y check decorativo", () => {
  const { container } = render(<StatusPill status="Entregada" />);
  const badge = screen.getByText("Entregada", { exact: true });
  expect(badge.classList.contains("bg-delivered")).toBe(true);
  expect(badge.classList.contains("text-white")).toBe(true);
  expect(badge.classList.contains("min-h-7")).toBe(true);
  expect(badge.classList.contains("cursor-default")).toBe(true);
  expect(badge.tagName).toBe("SPAN");
  expect(badge.hasAttribute("tabindex")).toBe(false);
  expect(container.querySelector('svg[aria-hidden="true"] path')).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
});

it("distingue una entrega especial en morado sin crear un estado nuevo", () => {
  render(<StatusPill status="Entregada" classification="special" />);
  const badge = screen.getByText("Entregada", { exact: true });
  expect(badge.classList.contains("bg-delivered-special")).toBe(true);
  expect(badge.classList.contains("bg-delivered")).toBe(false);
  expect(badge.getAttribute("aria-label")).toBe("Entregada · Actividad especial");
  expect(badge.getAttribute("data-activity-status")).toBe("Entregada");
});

it.each(["Programada", "En proceso"] as const)("no cambia el color de %s por ser especial", status => {
  render(<StatusPill status={status} classification="special" />);
  expect(screen.getByText(status).className).not.toContain("bg-delivered");
});

it.each([
  ["Programada", "○", "bg-blue/10"],
  ["En proceso", "◐", "bg-process"],
] as const)("conserva símbolo y estilo del estado %s", (status, symbol, background) => {
  const { container } = render(<StatusPill status={status} />);
  const badge = screen.getByText(status);
  expect(badge.classList.contains(background)).toBe(true);
  expect(badge.classList.contains("min-h-6")).toBe(true);
  expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe(symbol);
  expect(container.querySelector("svg")).toBeNull();
});
