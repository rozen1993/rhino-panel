import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createServerClient,
}));

import { listSupabaseHistoricalActivities } from "@/lib/supabase/historical";

type Response = {
  data: unknown[] | null;
  error: { message: string } | null;
};
type Operation = { name: string; args: unknown[] };
type QueryCall = { table: string; operations: Operation[] };

function fakeClient(
  queued: Array<{ table: string; response: Response }>,
) {
  const calls: QueryCall[] = [];
  const client = {
    from: vi.fn((table: string) => {
      const next = queued.shift();
      if (!next) throw new Error(`Consulta inesperada sobre ${table}`);
      if (next.table !== table) {
        throw new Error(`Se esperaba ${next.table}, no ${table}`);
      }
      const operations: Operation[] = [];
      calls.push({ table, operations });
      const builder: Record<string, unknown> = {};
      for (const name of [
        "select",
        "lte",
        "gte",
        "gt",
        "order",
        "limit",
        "in",
        "is",
        "eq",
      ]) {
        builder[name] = (...args: unknown[]) => {
          operations.push({ name, args });
          return builder;
        };
      }
      builder.then = (
        resolve: (value: Response) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(next.response).then(resolve, reject);
      return builder;
    }),
  };
  return { client, calls, remaining: queued };
}

function behavioralClient(
  tables: Record<string, Array<Record<string, unknown>>>,
  maxRows: number,
) {
  const calls: QueryCall[] = [];
  const client = {
    from: vi.fn((table: string) => {
      const operations: Operation[] = [];
      calls.push({ table, operations });
      const builder: Record<string, unknown> = {};
      for (const name of [
        "select",
        "lte",
        "gte",
        "gt",
        "order",
        "limit",
        "in",
        "is",
        "eq",
      ]) {
        builder[name] = (...args: unknown[]) => {
          operations.push({ name, args });
          return builder;
        };
      }
      builder.then = (
        resolve: (value: Response) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => {
        let rows = [...(tables[table] ?? [])];
        for (const operation of operations) {
          const [rawColumn, value] = operation.args;
          const column = String(rawColumn);
          if (operation.name === "lte") {
            rows = rows.filter((row) => String(row[column]) <= String(value));
          } else if (operation.name === "gte") {
            rows = rows.filter((row) => String(row[column]) >= String(value));
          } else if (operation.name === "gt") {
            rows = rows.filter((row) => {
              const current = row[column];
              return typeof current === "number" && typeof value === "number"
                ? current > value
                : String(current) > String(value);
            });
          } else if (operation.name === "in") {
            const accepted = value as unknown[];
            rows = rows.filter((row) => accepted.includes(row[column]));
          } else if (operation.name === "is" || operation.name === "eq") {
            rows = rows.filter((row) => row[column] === value);
          } else if (operation.name === "order") {
            const options = value as { ascending?: boolean } | undefined;
            const direction = options?.ascending === false ? -1 : 1;
            rows.sort((left, right) =>
              String(left[column]).localeCompare(String(right[column]), "en", {
                numeric: true,
              }) * direction,
            );
          } else if (operation.name === "limit") {
            rows = rows.slice(0, Math.min(Number(rawColumn), maxRows));
          }
        }
        return Promise.resolve(ok(rows)).then(resolve, reject);
      };
      return builder;
    }),
  };
  return { client, calls };
}

function ok(data: unknown[]): Response {
  return { data, error: null };
}

const activeId = "11111111-1111-4111-8111-111111111111";
const deletedId = "22222222-2222-4222-8222-222222222222";
const secondActiveId = "33333333-3333-4333-8333-333333333333";
const thirdActiveId = "44444444-4444-4444-8444-444444444444";

describe("lector Supabase del Histórico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pagina por keyset, excluye Papelera y conserva todas las jornadas", async () => {
    const setup = fakeClient([
      {
        table: "activity_date_spans",
        response: ok([
          {
            id: 4,
            activity_id: activeId,
            position: 2,
            start_date: "2026-12-30",
            end_date: "2027-01-03",
          },
          {
            id: 8,
            activity_id: activeId,
            position: 1,
            start_date: "2026-06-01",
            end_date: "2026-06-01",
          },
          {
            id: 9,
            activity_id: deletedId,
            position: 1,
            start_date: "2026-08-01",
            end_date: "2026-08-01",
          },
        ]),
      },
      { table: "activity_date_spans", response: ok([]) },
      {
        table: "activities",
        response: ok([
          {
            id: activeId,
            type: "Locución",
            title: "Campaña anual",
            responsible_name: "Luis Mendoza",
            status: "En proceso",
            origin: "burson",
            description: "Actividad activa",
            material_link: "https://example.com/material",
            operator_opinion: "Avance registrado",
          },
        ]),
      },
      { table: "activities", response: ok([]) },
      {
        table: "activity_date_spans",
        response: ok([
          {
            id: 4,
            activity_id: activeId,
            position: 2,
            start_date: "2026-12-30",
            end_date: "2027-01-03",
          },
          {
            id: 8,
            activity_id: activeId,
            position: 1,
            start_date: "2026-06-01",
            end_date: "2026-06-01",
          },
          {
            id: 12,
            activity_id: activeId,
            position: 3,
            start_date: "2028-02-01",
            end_date: "2028-02-02",
          },
        ]),
      },
      { table: "activity_date_spans", response: ok([]) },
    ]);
    mocks.createServerClient.mockResolvedValue(setup.client);

    const result = await listSupabaseHistoricalActivities(2026);

    expect(result).toEqual([
      {
        id: activeId,
        type: "Locución",
        title: "Campaña anual",
        responsible: "Luis Mendoza",
        status: "En proceso",
        origin: "burson",
        spans: [
          { start: "2026-06-01", end: "2026-06-01" },
          { start: "2026-12-30", end: "2027-01-03" },
          { start: "2028-02-01", end: "2028-02-02" },
        ],
        description: "Actividad activa",
        materialLink: "https://example.com/material",
        operatorOpinion: "Avance registrado",
      },
    ]);
    expect(setup.remaining).toHaveLength(0);
    expect(setup.calls.map((call) => call.table)).toEqual([
      "activity_date_spans",
      "activity_date_spans",
      "activities",
      "activities",
      "activity_date_spans",
      "activity_date_spans",
    ]);

    const candidateQueries = setup.calls.slice(0, 2);
    expect(candidateQueries[0].operations).toContainEqual({
      name: "lte",
      args: ["start_date", "2026-12-31"],
    });
    expect(candidateQueries[0].operations).toContainEqual({
      name: "gte",
      args: ["end_date", "2026-01-01"],
    });
    expect(candidateQueries[0].operations).toContainEqual({
      name: "gt",
      args: ["id", 0],
    });
    expect(candidateQueries[1].operations).toContainEqual({
      name: "gt",
      args: ["id", 9],
    });

    const activityQuery = setup.calls[2].operations;
    expect(activityQuery).toContainEqual({
      name: "in",
      args: ["id", [activeId, deletedId]],
    });
    expect(activityQuery).toContainEqual({
      name: "is",
      args: ["deleted_at", null],
    });
    expect(activityQuery.some((operation) => operation.name === "eq")).toBe(
      false,
    );
    expect(setup.calls[4].operations).toContainEqual({
      name: "in",
      args: ["activity_id", [activeId]],
    });
    expect(mocks.createServerClient).toHaveBeenCalledTimes(1);
  });

  it("revalida el solapamiento con las jornadas finales y elimina fantasmas", async () => {
    const setup = fakeClient([
      {
        table: "activity_date_spans",
        response: ok([
          {
            id: 1,
            activity_id: activeId,
            position: 1,
            start_date: "2026-03-01",
            end_date: "2026-03-02",
          },
        ]),
      },
      { table: "activity_date_spans", response: ok([]) },
      {
        table: "activities",
        response: ok([
          {
            id: activeId,
            type: "Edición",
            title: "Replanificada",
            responsible_name: "Ana Torres",
            status: "Programada",
            origin: "operario",
            description: "Se movió durante la lectura",
            material_link: "",
            operator_opinion: "",
          },
        ]),
      },
      { table: "activities", response: ok([]) },
      {
        table: "activity_date_spans",
        response: ok([
          {
            id: 2,
            activity_id: activeId,
            position: 1,
            start_date: "2027-03-01",
            end_date: "2027-03-02",
          },
        ]),
      },
      { table: "activity_date_spans", response: ok([]) },
    ]);
    mocks.createServerClient.mockResolvedValue(setup.client);

    await expect(listSupabaseHistoricalActivities(2026)).resolves.toEqual([]);
  });

  it("aplica los operadores y pagina aunque el max_rows remoto sea menor", async () => {
    const setup = behavioralClient(
      {
        activity_date_spans: [
          {
            id: 1,
            activity_id: activeId,
            position: 1,
            start_date: "2026-01-03",
            end_date: "2026-01-03",
          },
          {
            id: 2,
            activity_id: secondActiveId,
            position: 1,
            start_date: "2026-02-04",
            end_date: "2026-02-04",
          },
          {
            id: 3,
            activity_id: thirdActiveId,
            position: 1,
            start_date: "2026-03-05",
            end_date: "2026-03-05",
          },
          {
            id: 4,
            activity_id: deletedId,
            position: 1,
            start_date: "2026-04-06",
            end_date: "2026-04-06",
          },
          {
            id: 5,
            activity_id: "fuera-del-anio",
            position: 1,
            start_date: "2027-01-01",
            end_date: "2027-01-01",
          },
          {
            id: 6,
            activity_id: activeId,
            position: 2,
            start_date: "2028-01-01",
            end_date: "2028-01-01",
          },
        ],
        activities: [
          {
            id: activeId,
            type: "Edición",
            title: "Primera activa",
            responsible_name: "Ana Torres",
            status: "Programada",
            origin: "operario",
            description: "Primera",
            material_link: "",
            operator_opinion: "",
            deleted_at: null,
          },
          {
            id: secondActiveId,
            type: "Grabación",
            title: "Segunda activa",
            responsible_name: "Carlos Vega",
            status: "En proceso",
            origin: "operario",
            description: "Segunda",
            material_link: "",
            operator_opinion: "",
            deleted_at: null,
          },
          {
            id: deletedId,
            type: "Creatividad",
            title: "En Papelera",
            responsible_name: "Ana Torres",
            status: "Programada",
            origin: "operario",
            description: "Borrada",
            material_link: "",
            operator_opinion: "",
            deleted_at: "2026-04-01T12:00:00Z",
          },
          {
            id: thirdActiveId,
            type: "Locución",
            title: "Tercera activa",
            responsible_name: "Luis Mendoza",
            status: "Programada",
            origin: "operario",
            description: "Tercera",
            material_link: "",
            operator_opinion: "",
            deleted_at: null,
          },
        ],
      },
      2,
    );
    mocks.createServerClient.mockResolvedValue(setup.client);

    const result = await listSupabaseHistoricalActivities(2026);

    expect(result.map((item) => item.id)).toEqual([
      activeId,
      secondActiveId,
      thirdActiveId,
    ]);
    expect(result[0].spans).toEqual([
      { start: "2026-01-03", end: "2026-01-03" },
      { start: "2028-01-01", end: "2028-01-01" },
    ]);
    expect(result.some((item) => item.id === deletedId)).toBe(false);
    expect(
      setup.calls.filter((call) => call.table === "activity_date_spans")
        .length,
    ).toBeGreaterThan(5);
  });

  it("divide UUID en lotes de cien sin omitir resultados", async () => {
    const ids = Array.from(
      { length: 101 },
      (_, index) => `activity-${String(index + 1).padStart(3, "0")}`,
    );
    const candidateSpans = ids.map((id, index) => ({
      id: index + 1,
      activity_id: id,
      position: 1,
      start_date: "2026-04-01",
      end_date: "2026-04-01",
    }));
    const rows = ids.map((id) => ({
      id,
      type: "Creatividad",
      title: `Actividad ${id}`,
      responsible_name: "Ana Torres",
      status: "Programada",
      origin: "operario",
      description: "Actividad por lote",
      material_link: "",
      operator_opinion: "",
    }));
    const setup = behavioralClient(
      {
        activity_date_spans: candidateSpans,
        activities: rows.map((row) => ({ ...row, deleted_at: null })),
      },
      1000,
    );
    mocks.createServerClient.mockResolvedValue(setup.client);

    const result = await listSupabaseHistoricalActivities(2026);

    expect(result).toHaveLength(101);
    const activityQueries = setup.calls.filter(
      (call) => call.table === "activities",
    );
    expect(activityQueries).toHaveLength(4);
    const batchLengths = activityQueries.map((call) => {
      const operation = call.operations.find((item) => item.name === "in");
      return (operation?.args[1] as string[]).length;
    });
    expect([...new Set(batchLengths)].sort((left, right) => left - right)).toEqual([
      1,
      100,
    ]);
    expect(
      activityQueries.some((call) =>
        call.operations.some((operation) => operation.name === "gt"),
      ),
    ).toBe(true);
  });

  it("detiene la consulta cuando no hay candidatos y propaga errores de lectura", async () => {
    const empty = fakeClient([
      { table: "activity_date_spans", response: ok([]) },
    ]);
    mocks.createServerClient.mockResolvedValueOnce(empty.client);
    await expect(listSupabaseHistoricalActivities(2026)).resolves.toEqual([]);
    expect(empty.calls).toHaveLength(1);

    const failed = fakeClient([
      {
        table: "activity_date_spans",
        response: { data: null, error: { message: "RLS rechazó la lectura" } },
      },
    ]);
    mocks.createServerClient.mockResolvedValueOnce(failed.client);
    await expect(listSupabaseHistoricalActivities(2026)).rejects.toThrow(
      "No se pudieron localizar las actividades del año: RLS rechazó la lectura",
    );
  });

  it("rechaza una página cuyo cursor no avanza", async () => {
    const stuck = fakeClient([
      {
        table: "activity_date_spans",
        response: ok([
          {
            id: 1,
            activity_id: activeId,
            position: 1,
            start_date: "2026-01-01",
            end_date: "2026-01-01",
          },
        ]),
      },
      {
        table: "activity_date_spans",
        response: ok([
          {
            id: 1,
            activity_id: activeId,
            position: 1,
            start_date: "2026-01-01",
            end_date: "2026-01-01",
          },
        ]),
      },
    ]);
    mocks.createServerClient.mockResolvedValue(stuck.client);

    await expect(listSupabaseHistoricalActivities(2026)).rejects.toThrow(
      /La paginación .* no pudo avanzar\./,
    );

    const stuckActivities = fakeClient([
      {
        table: "activity_date_spans",
        response: ok([
          {
            id: 1,
            activity_id: activeId,
            position: 1,
            start_date: "2026-01-01",
            end_date: "2026-01-01",
          },
        ]),
      },
      { table: "activity_date_spans", response: ok([]) },
      {
        table: "activities",
        response: ok([
          {
            id: activeId,
            type: "Edición",
            title: "Cursor estancado",
            responsible_name: "Ana Torres",
            status: "Programada",
            origin: "operario",
            description: "No avanza",
            material_link: "",
            operator_opinion: "",
          },
        ]),
      },
      {
        table: "activities",
        response: ok([
          {
            id: activeId,
            type: "Edición",
            title: "Cursor estancado",
            responsible_name: "Ana Torres",
            status: "Programada",
            origin: "operario",
            description: "No avanza",
            material_link: "",
            operator_opinion: "",
          },
        ]),
      },
    ]);
    mocks.createServerClient.mockResolvedValueOnce(stuckActivities.client);
    await expect(listSupabaseHistoricalActivities(2026)).rejects.toThrow(
      "La paginación de actividades del Histórico no pudo avanzar.",
    );
  });
});
