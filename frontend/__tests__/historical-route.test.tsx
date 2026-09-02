import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HistoricalActivity } from "@/lib/historical";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  resolveDataSource: vi.fn(),
  listHistorical: vi.fn(),
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
}));

import HistoricalPage from "@/app/historico/page";

const role = { id: "admin", label: "Admin" };
const activity: HistoricalActivity = {
  id: "historical-activity",
  type: "Edición",
  title: "Actividad real",
  responsible: "Ana Torres",
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
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockImplementation(
      async (allow: (candidate: typeof role) => boolean) => {
        expect(allow(role)).toBe(true);
        expect(allow({ ...role, id: "operario" })).toBe(false);
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
});
