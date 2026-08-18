import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AunorStatusPill, aunorStatuses } from "@/components/aunor-status-pill";
import { BursonStatusPill, bursonStatuses } from "@/components/burson-status-pill";
import { MonthStrip, months } from "@/components/month-strip";
import { roles } from "@/lib/roles";
import { NavBar } from "@/components/nav-bar";
import { StatusPill, internalStatuses } from "@/components/status-pill";

describe("familias de estado", () => {
  it("renderiza los siete estados internos con signo", () => {
    const { container } = render(<>{internalStatuses.map((status) => <StatusPill key={status} status={status} />)}</>);
    expect(container.querySelectorAll("span > span")).toHaveLength(7);
    internalStatuses.forEach((status) => expect(screen.getByText(status)).toBeDefined());
  });

  it("renderiza los cinco estados de AUNOR y los cinco de Burson", () => {
    render(<><div data-testid="aunor">{aunorStatuses.map((status) => <AunorStatusPill key={status} status={status} />)}</div><div data-testid="burson">{bursonStatuses.map((status) => <BursonStatusPill key={status} status={status} />)}</div></>);
    expect(screen.getByTestId("aunor").children).toHaveLength(5);
    expect(screen.getByTestId("burson").children).toHaveLength(5);
  });
});

describe("navegación por rol", () => {
  it("reserva Burson a quien lo tiene en su rol", () => {
    const { rerender } = render(<NavBar presentation="mobile" role={roles.grabacion} />);
    expect(screen.queryByText("Burson")).toBeNull();
    rerender(<NavBar presentation="mobile" role={roles.coordinacion} />);
    expect(screen.getByText("Burson")).toBeDefined();
    rerender(<NavBar presentation="mobile" role={roles.supervision} />);
    expect(screen.getByText("Burson")).toBeDefined();
  });

  it("solo Supervisión ve Cuentas e Importar", () => {
    const { rerender } = render(<NavBar presentation="mobile" role={roles.edicion} />);
    expect(screen.queryByText("Cuentas")).toBeNull();
    rerender(<NavBar presentation="mobile" role={roles.supervision} />);
    expect(screen.getByText("Cuentas")).toBeDefined();
    expect(screen.getByText("Importar")).toBeDefined();
  });

  it("un rol de trabajo no ve el panel de Supervisión", () => {
    render(<NavBar presentation="mobile" role={roles.locucion} />);
    expect(screen.queryByText("Supervisión")).toBeNull();
  });
});

describe("MonthStrip", () => {
  it("muestra siempre los doce meses y marca el activo", () => {
    render(<MonthStrip activeMonth="AGO" counts={[5, 7, 6, 6, 8, 10, 9, 12, 0, 0, 0, 0]} />);
    expect(screen.getByRole("list", { name: "Actividades por mes" }).children).toHaveLength(12);
    months.forEach((month) => expect(screen.getByText(month)).toBeDefined());
    expect(screen.getByText("AGO").parentElement?.getAttribute("aria-current")).toBe("date");
  });

  it("rechaza una lista incompleta", () => {
    expect(() => render(<MonthStrip activeMonth="AGO" counts={[1, 2]} />)).toThrow("MonthStrip necesita exactamente doce conteos.");
  });
});
