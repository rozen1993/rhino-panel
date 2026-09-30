import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StatusPill } from "@/components/status-pill";

it("representa Entregada con el verde sólido aprobado y check decorativo, no un botón", () => {
  const { container } = render(<StatusPill status="Entregada" />);
  const badge = screen.getByText("Entregada", { exact: true });
  expect(badge.classList.contains("bg-[#216337]")).toBe(true);
  expect(badge.classList.contains("text-white")).toBe(true);
  expect(badge.classList.contains("min-h-7")).toBe(true);
  expect(badge.classList.contains("cursor-default")).toBe(true);
  expect(badge.tagName).toBe("SPAN");
  expect(badge.hasAttribute("tabindex")).toBe(false);
  expect(container.querySelector('svg[aria-hidden="true"] path')).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
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
