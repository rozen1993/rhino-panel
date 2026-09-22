import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HistoricalActivity } from "@/lib/historical";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  resolveDataSource: vi.fn(),
  listHistorical: vi.fn(),
  listTeamHistorical: vi.fn(),
}));

vi.mock("@/components/mobile-shell", () => ({
  MobileShell: ({ children }: { children: ReactNode }) => <>{children}</>,
  requireRole: mocks.requireRole,
}));
vi.mock("@/components/annual-calendar", () => ({
  AnnualCalendar: ({
    dataSource,
    initialActivities,
    today,
    year,
  }: {
    dataSource: string;
    initialActivities: HistoricalActivity[];
    today: string;
    year: number;
  }) => (
    <div
      data-count={initialActivities.length}
      data-source={dataSource}
      data-testid="annual-calendar"
      data-today={today}
      data-year={year}
    />
  ),
}));
vi.mock("@/lib/data-source", () => ({
  resolveDataSource: mocks.resolveDataSource,
}));
vi.mock("@/lib/supabase/historical", () => ({
  listSupabaseHistoricalActivities: mocks.listHistorical,
  listSupabaseTeamHistoricalActivities: mocks.listTeamHistorical,
}));

import HistoricalPage from "@/app/historico/page";

const role = { id: "admin", label: "Admin" };
const activity: HistoricalActivity = {
  id: "historical-activity",
  type: "Edición",
  title: "Actividad real",
  responsible: "Ana Torres",
  place: "Lima",
  status: "Programada",
  origin: "operario",
  spans: [{ start: "2027-03-01", end: "2027-03-02" }],
  description: "Descripción",
  materialLink: "",
  operatorOpinion: "",
};

async function renderPage(anio?: string) {
  const element = await HistoricalPage({
    params: Promise.resolve({}),
    searchParams: Promise.resolve(anio === undefined ? {} : { anio }),
  } as never);
  render(element);
}

describe("ruta del Histórico", () => {
  it("un filtro repetido o desconocido vuelve a la entrada sin leer actividades", async () => {
    mocks.resolveDataSource.mockReturnValue("supabase");
    render(await HistoricalPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ tipo: ["todos", "x"], anio: "2026" }) } as never));
    expect(mocks.listHistorical).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Ver histórico de grabación" })).toBeTruthy();
  });
  it("abre la entrada panorámica sin consultar actividades y mantiene solo las dos rutas", async () => {
    mocks.resolveDataSource.mockReturnValue("supabase");
    await renderPage();
    expect(mocks.listHistorical).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Ver histórico de grabación" }).getAttribute("href")).toContain("tipo=grabacion");
    expect(screen.getByRole("link", { name: "Ver histórico de edición" }).getAttribute("href")).toContain("tipo=edicion");
    expect(screen.queryByRole("link", { name: /Ver todo el Histórico/ })).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.queryByText("VS")).toBeNull();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockImplementation(
      async (allow: (candidate: typeof role) => boolean) => {
        expect(allow(role)).toBe(true);
        expect(allow({ ...role, id: "operario" })).toBe(true);
        expect(allow({ ...role, id: "aunor" })).toBe(false);
        return role;
      },
    );
  });

  it("autentica al Admin antes de leer el año real en Supabase", async () => {
    mocks.resolveDataSource.mockReturnValue("supabase");
    mocks.listHistorical.mockResolvedValue([activity]);

    await renderPage("2027");

    const calendar = screen.getByTestId("annual-calendar");
    expect(calendar.dataset.source).toBe("supabase");
    expect(calendar.dataset.year).toBe("2027");
    expect(calendar.dataset.count).toBe("1");
    expect(calendar.dataset.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(mocks.listHistorical).toHaveBeenCalledWith(2027);
    expect(mocks.requireRole.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.listHistorical.mock.invocationCallOrder[0],
    );
  });

  it("no toca Supabase en demo y clampa una URL anterior a 2026", async () => {
    mocks.resolveDataSource.mockReturnValue("demo");

    await renderPage("2025");

    const calendar = screen.getByTestId("annual-calendar");
    expect(calendar.dataset.source).toBe("demo");
    expect(calendar.dataset.year).toBe("2026");
    expect(calendar.dataset.count).toBe("0");
    expect(mocks.listHistorical).not.toHaveBeenCalled();
  });
  it("el operario consulta la proyección del equipo y no el lector privado", async () => {
    mocks.requireRole.mockResolvedValue({ ...role, id: "operario" });
    mocks.resolveDataSource.mockReturnValue("supabase");
    mocks.listTeamHistorical.mockResolvedValue([activity]);
    await renderPage("2026");
    expect(mocks.listTeamHistorical).toHaveBeenCalledWith(2026);
    expect(mocks.listHistorical).not.toHaveBeenCalled();
    expect(screen.getByTestId("annual-calendar").dataset.count).toBe("1");
  });
});
