import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ from: mocks.from }) }));
import { listSupabaseTeamHistoricalActivities } from "@/lib/supabase/historical";

const row = (id: string, spans = [{ start: "2026-09-21", end: "2026-09-21", place: "Norte" }]) => ({
  id, version: 1, type: "Grabación", title: "Actividad del equipo", responsible_name: "Otro operario",
  status: "Programada", origin: "operario", description: "Descripción", place: "Lima",
  material_link: "", operator_opinion: "", recording_modes: ["Video", "Vuelo con dron"], spans,
});
function page(data: ReturnType<typeof row>[], error: unknown = null) {
  const query: Record<string, unknown> = { then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve) };
  for (const key of ["select", "lte", "gte", "order", "limit", "gt"]) query[key] = vi.fn(() => query);
  mocks.from.mockReturnValueOnce(query);
  return query;
}
beforeEach(() => vi.resetAllMocks());

it("pagina la proyección del equipo y conserva jornadas y modalidades de otros responsables", async () => {
  const first = page([row("a"), row("b", [{ start: "2025-12-01", end: "2025-12-01", place: "Sur" }, { start: "2027-01-01", end: "2027-01-01", place: "Sur" }])]);
  const second = page([row("c")]);
  page([]);
  const result = await listSupabaseTeamHistoricalActivities(2026);
  expect(result.map(activity => activity.id).sort()).toEqual(["a", "c"]);
  expect(result[0]).toMatchObject({ responsible: "Otro operario", recordingModes: ["Video", "Vuelo con dron"], spans: [{ start: "2026-09-21", end: "2026-09-21", place: "Norte" }] });
  expect(mocks.from.mock.calls.every(([table]) => table === "team_historical_activities")).toBe(true);
  expect(first.lte).toHaveBeenCalledWith("first_date", "2026-12-31");
  expect(first.gte).toHaveBeenCalledWith("last_date", "2026-01-01");
  expect(second.gt).toHaveBeenCalledWith("id", "b");
});

it("no presenta un histórico parcial cuando falla una página", async () => {
  page([row("a")]); page([], { code: "42501" });
  await expect(listSupabaseTeamHistoricalActivities(2026)).rejects.toThrow("No se pudo cargar");
});

it("detiene un cursor repetido", async () => {
  page([row("a")]); page([row("a")]);
  await expect(listSupabaseTeamHistoricalActivities(2026)).rejects.toThrow("no pudo avanzar");
});
