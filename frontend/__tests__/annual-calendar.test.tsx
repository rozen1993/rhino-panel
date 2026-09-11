import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnnualCalendar } from "@/components/annual-calendar";
import type { HistoricalActivity } from "@/lib/historical";

function activity(
  id: string,
  title: string,
  type: HistoricalActivity["type"] = "Edición",
): HistoricalActivity {
  return {
    id,
    type,
    title,
    responsible: "Ana Torres",
    place: "Lima",
    status: "Entregada",
    origin: "operario",
    spans: [{ start: "2026-08-01", end: "2026-08-01" }],
    description: `Descripción de ${title}`,
    materialLink: "",
    operatorOpinion: "Trabajo completado",
  };
}

let mobileMatches = true;
const mediaListeners = new Set<(event: MediaQueryListEvent) => void>();

function setMobile(matches = true) {
  mobileMatches = matches;
  mediaListeners.clear();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      get matches() {
        return mobileMatches;
      },
      media: "(max-width: 767px)",
      onchange: null,
      addEventListener: vi.fn(
        (type: string, listener: (event: MediaQueryListEvent) => void) => {
          if (type === "change") mediaListeners.add(listener);
        },
      ),
      removeEventListener: vi.fn(
        (type: string, listener: (event: MediaQueryListEvent) => void) => {
          if (type === "change") mediaListeners.delete(listener);
        },
      ),
      addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) =>
        mediaListeners.add(listener),
      ),
      removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) =>
        mediaListeners.delete(listener),
      ),
      dispatchEvent: vi.fn(),
    })),
    writable: true,
  });
}

function changeMobile(matches: boolean) {
  mobileMatches = matches;
  const event = {
    matches,
    media: "(max-width: 767px)",
  } as MediaQueryListEvent;
  [...mediaListeners].forEach((listener) => listener(event));
}

describe("calendario anual compartido", () => {
  it("filtra antes de contar y distingue actividades homónimas sin duplicar jornadas", () => {
    setMobile(false);
    const first = { ...activity("id-uno", "Mismo título", "Grabación"), spans: [{ start: "2026-08-01", end: "2026-08-01", place: "Norte" }, { start: "2026-08-01", end: "2026-08-01", place: "Sur" }] };
    render(<AnnualCalendar dataSource="supabase" category="Grabación" year={2026} today="2026-08-31" initialActivities={[first, activity("id-dos", "Mismo título", "Grabación"), activity("id-edicion", "Otra categoría", "Edición")]} />);
    expect(screen.getByText("Archivo operativo · 2 registros")).toBeTruthy();
    expect(screen.queryByText("Otra categoría")).toBeNull();
    const day = screen.getByRole("button", { name: /1 de agosto: Grabación/ });
    expect(day.textContent).toBe("12");
    fireEvent.click(day);
    const choices = screen.getByRole("region", { name: "Actividades de esta fecha" });
    expect(within(choices).getAllByRole("button")).toHaveLength(2);
    expect(within(choices).getByRole("button", { name: /ID: id-uno/ }).closest("article")?.textContent).toContain("Norte · Sur");
    fireEvent.click(within(choices).getByRole("button", { name: /ID: id-dos/ }));
    expect(screen.queryByRole("region", { name: "Actividades de esta fecha" })).toBeNull();
    expect(screen.getByText("ID: id-dos")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Volver a las actividades del día/ }));
    expect(screen.getByRole("region", { name: "Actividades de esta fecha" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Año siguiente" }).getAttribute("href")).toContain("tipo=grabacion");
    expect(screen.getByRole("heading", { name: "DICIEMBRE" })).toBeTruthy();
  });
  beforeEach(() => {
    setMobile();
    document.body.style.overflow = "";
  });

  it("navega por URL y bloquea el año anterior en el piso 2026", () => {
    const { rerender } = render(
      <AnnualCalendar
        dataSource="supabase"
        initialActivities={[activity("a", "Actividad A")]}
        today="2026-08-31"
        year={2026}
      />,
    );

    expect(
      (screen.getByRole("button", {
        name: "Año anterior",
      }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      screen
        .getByRole("link", { name: "Año siguiente" })
        .getAttribute("href"),
    ).toBe("/historico?anio=2027");

    rerender(
      <AnnualCalendar
        dataSource="supabase"
        initialActivities={[]}
        today="2026-08-31"
        year={2027}
      />,
    );
    expect(
      screen
        .getByRole("link", { name: "Año anterior" })
        .getAttribute("href"),
    ).toBe("/historico?anio=2026");
  });

  it("muestra el vacío en móvil y conserva la rejilla aprobada 1/2/4", () => {
    render(
      <AnnualCalendar
        dataSource="supabase"
        initialActivities={[]}
        today="2026-08-31"
        year={2099}
      />,
    );

    expect(
      screen.getAllByRole("status").some((status) =>
        status.textContent?.includes("No hay actividades registradas en 2099"),
      ),
    ).toBe(true);
    const january = screen.getByText("ENERO", { exact: true }).closest("section");
    expect(january?.parentElement?.className).toContain("md:grid-cols-2");
    expect(january?.parentElement?.className).toContain("xl:grid-cols-4");
  });

  it("abre un detalle móvil accesible, atrapa el foco y lo cierra al rotar", async () => {
    render(
      <AnnualCalendar
        dataSource="supabase"
        initialActivities={[
          activity("a", "Actividad A", "Edición"),
          activity("b", "Actividad B", "Locución"),
        ]}
        today="2026-08-31"
        year={2026}
      />,
    );

    const day = screen.getByRole("button", {
      name: /1 de agosto: Edición, Actividad A; Locución, Actividad B/i,
    });
    day.focus();
    fireEvent.click(day);

    const dialog = screen.getByRole("dialog", {
      name: "2 actividades en esta fecha",
    });
    const close = screen.getByRole("button", { name: "Cerrar detalle" });
    expect(document.activeElement).toBe(close);
    expect(document.body.style.overflow).toBe("hidden");
    expect(
      document.querySelectorAll("#activity-detail-title-desktop"),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll("#activity-detail-title-mobile"),
    ).toHaveLength(1);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    const secondChoice = within(dialog).getByRole("button", {
      name: /Locución · Actividad B/,
    });
    expect(document.activeElement).toBe(secondChoice);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(close);

    day.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    day.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(secondChoice);

    fireEvent.click(secondChoice);
    expect(
      document.getElementById(
        dialog.getAttribute("aria-labelledby") ?? "missing",
      )?.textContent,
    ).toBe("Actividad B");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(day);
    expect(document.body.style.overflow).toBe("");

    setMobile(true);
    fireEvent.click(day);
    expect(screen.getByRole("dialog", { name: "2 actividades en esta fecha" })).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
    act(() => changeMobile(false));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(day);
    expect(document.body.style.overflow).toBe("");
  });

  it("mantiene el borde de un rango que cruza el inicio del año", () => {
    const crossing = activity("crossing", "Cruce anual");
    crossing.spans = [{ start: "2026-12-30", end: "2027-01-03" }];
    render(
      <AnnualCalendar
        dataSource="supabase"
        initialActivities={[crossing]}
        today="2026-08-31"
        year={2027}
      />,
    );

    const first = screen.getByRole("button", {
      name: /1 de enero: Edición, Cruce anual/i,
    });
    expect(first.className).toContain("rounded-l-none");
    expect(first.className).toContain("rounded-r-none");
  });
});
