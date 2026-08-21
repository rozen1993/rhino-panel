import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonthStrip } from "@/components/month-strip";

describe("contrato visual Aunor", () => {
  it("expone a Tailwind los colores de acento usados por la interfaz", () => {
    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    expect(css).toContain("--paper: #f4f7f8");
    expect(css).toContain("--ink: #10233f");
    expect(css).toContain("--color-cyan: var(--blue)");
    expect(css).toContain("--color-lime: var(--amber)");
    expect(css).toContain("--action-gradient:");
  });

  it("permite recorrer los meses con los controles laterales", () => {
    render(createElement(MonthStrip, { activeMonth: "AGO", counts: Array(12).fill(0) }));
    expect(screen.queryByText("NOV")).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: "Meses siguientes" })[0]);
    expect(screen.getAllByText("NOV").length).toBeGreaterThan(0);
  });
});
