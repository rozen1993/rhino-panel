import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createServerClient,
}));

import {
  getSupabaseActivity,
  listSupabaseActivities,
  listSupabaseBursonRequests,
  listSupabaseTrashedActivities,
} from "@/lib/supabase/activities";
import {
  advanceNumericCursor,
  advanceStringCursor,
} from "@/lib/supabase/pagination";
import {
  listAssignableOperators,
  listSupabaseAccounts,
} from "@/lib/supabase/profiles";

type Row = Record<string, unknown>;
type Operation = { name: string; args: unknown[] };
type QueryCall = { table: string; operations: Operation[] };
type Response = { data: Row[]; error: null };

function compareValues(left: unknown, right: unknown) {
  if (left === right) return 0;
  if (left === null || left === undefined) return -1;
  if (right === null || right === undefined) return 1;
  if (typeof left === "number" && typeof right === "number")
    return left - right;
  return String(left).localeCompare(String(right));
}

function behavioralClient(
  tables: Record<string, Row[]>,
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
        "eq",
        "is",
        "not",
        "in",
        "gt",
        "order",
        "limit",
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
          const [rawColumn, value, extra] = operation.args;
          const column = String(rawColumn);
          if (operation.name === "eq" || operation.name === "is") {
            rows = rows.filter((row) => row[column] === value);
          } else if (operation.name === "not") {
            if (value === "is") {
              rows = rows.filter((row) => row[column] !== extra);
            }
          } else if (operation.name === "in") {
            const accepted = value as unknown[];
            rows = rows.filter((row) => accepted.includes(row[column]));
          } else if (operation.name === "gt") {
            rows = rows.filter(
              (row) => compareValues(row[column], value) > 0,
            );
          }
        }

        const orders = operations.filter(
          (operation) => operation.name === "order",
        );
        rows.sort((left, right) => {
          for (const operation of orders) {
            const column = String(operation.args[0]);
            const options = operation.args[1] as
              | { ascending?: boolean }
              | undefined;
            const compared = compareValues(left[column], right[column]);
            if (compared)
              return options?.ascending === false ? -compared : compared;
          }
          return 0;
        });

        const requested = operations
          .filter((operation) => operation.name === "limit")
          .at(-1)?.args[0];
        const limit =
          typeof requested === "number"
            ? Math.min(requested, maxRows)
            : maxRows;
        return Promise.resolve({ data: rows.slice(0, limit), error: null }).then(
          resolve,
          reject,
        );
      };
      return builder;
    }),
  };
  return { client, calls };
}

function uuid(index: number) {
  return `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`;
}

function activity(index: number, origin: "admin" | "burson" = "admin") {
  const createdAt = new Date(Date.UTC(2026, 0, index)).toISOString();
  const updatedAt = new Date(Date.UTC(2026, 1, index)).toISOString();
  return {
    id: uuid(index),
    origin,
    created_by: uuid(90),
    created_by_role: origin === "burson" ? "burson" : "admin",
    responsible_id: uuid(91),
    responsible_name: "Operario",
    type: "grabacion",
    title: `Actividad ${index}`,
    description: "Descripcion",
    place: "Lima",
    status: "pendiente",
    material_link: "",
    operator_opinion: "",
    reference_link: "",
    version: 1,
    idempotency_key: null,
    idempotency_hash: null,
    thread_opened_at: null,
    delivered_at: null,
    deleted_at: null,
    deleted_by: null,
    deletion_reason: null,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function profile(index: number) {
  return {
    id: uuid(index),
    username: `operario${index}`,
    display_name: `Operario ${index}`,
    role: "operario",
    is_active: true,
    is_burson_operator: index === 1,
    can_create_own_activities: index === 2,
    must_change_password: false,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
  };
}

beforeEach(() => {
  mocks.createServerClient.mockReset();
});

describe("paginacion keyset de lecturas Supabase", () => {
  it("no trunca actividades ni jornadas y omite auditoria en el listado", async () => {
    const activities = Array.from({ length: 5 }, (_, index) =>
      activity(index + 1),
    );
    const spans = activities.flatMap((item, activityIndex) =>
      Array.from({ length: 2 }, (_, spanIndex) => ({
        id: activityIndex * 2 + spanIndex + 1,
        activity_id: item.id,
        position: spanIndex,
        start_date: `2026-03-${(spanIndex + 1).toString().padStart(2, "0")}`,
        end_date: `2026-03-${(spanIndex + 1).toString().padStart(2, "0")}`,
      })),
    );
    const setup = behavioralClient(
      {
        activities,
        activity_date_spans: spans,
      },
      2,
    );
    mocks.createServerClient.mockResolvedValue(setup.client);

    const result = await listSupabaseActivities();

    expect(result).toHaveLength(5);
    expect(result.map((item) => item.id)).toEqual(
      activities.map((item) => item.id).reverse(),
    );
    expect(result.every((item) => item.spans.length === 2)).toBe(true);
    expect(result.every((item) => item.audit.length === 0)).toBe(true);
    expect(result.every((item) => item.detailHydration === "summary")).toBe(
      true,
    );
    expect(
      setup.calls.filter((call) => call.table === "audit_events"),
    ).toHaveLength(0);
    expect(
      setup.calls.some((call) =>
        call.operations.some((operation) => operation.name === "gt"),
      ),
    ).toBe(true);
    expect(
      setup.calls.some((call) =>
        call.operations.some((operation) => operation.name === "range"),
      ),
    ).toBe(false);
  });

  it("pagina toda la conversacion de una actividad por id estable", async () => {
    const row = activity(1);
    const messages = Array.from({ length: 5 }, (_, index) => ({
      id: uuid(index + 20),
      activity_id: row.id,
      author_id: uuid(90),
      author_name: "Admin",
      author_role: "admin",
      body: `Mensaje ${index + 1}`,
      opens_thread: index === 0,
      version: 1,
      created_at: `2026-05-${(5 - index).toString().padStart(2, "0")}T10:00:00Z`,
      edited_at: null,
      deleted_at: null,
      deleted_by: null,
    }));
    const audits = Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      activity_id: row.id,
      actor_id: uuid(90),
      actor_name: "Admin",
      actor_role: "admin",
      action: `evento-${index + 1}`,
      detail: {},
      created_at: `2026-04-${(index + 1).toString().padStart(2, "0")}T10:00:00Z`,
    }));
    const setup = behavioralClient(
      {
        activities: [row],
        activity_date_spans: [],
        audit_events: audits,
        activity_messages: messages,
      },
      2,
    );
    mocks.createServerClient.mockResolvedValue(setup.client);

    const result = await getSupabaseActivity(row.id);

    expect(result?.thread).toHaveLength(5);
    expect(result?.audit).toHaveLength(5);
    expect(result?.detailHydration).toBe("complete");
    expect(result?.audit.map((entry) => entry.moment)).toEqual(
      [...audits]
        .sort(
          (left, right) =>
            right.created_at.localeCompare(left.created_at) ||
            right.id - left.id,
        )
        .map((entry) => entry.created_at),
    );
    expect(result?.thread.map((message) => message.createdAt)).toEqual(
      [...messages]
        .sort((left, right) =>
          left.created_at.localeCompare(right.created_at),
        )
        .map((message) => message.created_at),
    );
  });

  it("no trunca encargos Burson ni sus jornadas", async () => {
    const activities = Array.from({ length: 5 }, (_, index) =>
      activity(index + 1, "burson"),
    );
    const spans = activities.flatMap((item, activityIndex) =>
      Array.from({ length: 2 }, (_, spanIndex) => ({
        id: activityIndex * 2 + spanIndex + 1,
        activity_id: item.id,
        position: spanIndex,
        start_date: "2026-06-01",
        end_date: "2026-06-01",
      })),
    );
    const setup = behavioralClient(
      { activities, activity_date_spans: spans },
      2,
    );
    mocks.createServerClient.mockResolvedValue(setup.client);

    const result = await listSupabaseBursonRequests();

    expect(result).toHaveLength(5);
    expect(result.every((item) => item.spans.length === 2)).toBe(true);
    expect(result.map((item) => item.id)).toEqual(
      activities.map((item) => item.id).reverse(),
    );
  });

  it("pagina perfiles y conserva todo el historial de cuentas", async () => {
    const profiles = Array.from({ length: 5 }, (_, index) =>
      profile(index + 1),
    );
    const audits = profiles.flatMap((item, profileIndex) =>
      Array.from({ length: 3 }, (_, auditIndex) => ({
        id: profileIndex * 3 + auditIndex + 1,
        target_profile_id: item.id,
        actor_id: uuid(90),
        actor_name: `Admin ${auditIndex + 1}`,
        action: `cambio-${auditIndex + 1}`,
        detail: {},
        created_at: `2026-07-0${auditIndex + 1}T10:00:00Z`,
      })),
    );
    const setup = behavioralClient(
      { profiles, account_audit_events: audits },
      2,
    );
    mocks.createServerClient.mockResolvedValue(setup.client);

    const [accounts, operators] = await Promise.all([
      listSupabaseAccounts(),
      listAssignableOperators(),
    ]);

    expect(accounts).toHaveLength(5);
    expect(accounts.every((account) => account.history.length === 3)).toBe(
      true,
    );
    expect(accounts.every((account) => account.updatedBy === "Admin 3")).toBe(
      true,
    );
    expect(operators).toHaveLength(5);
  });

  it("divide mas de cien ids y recupera todos los lotes", async () => {
    const activities = Array.from({ length: 101 }, (_, index) =>
      activity(index + 1),
    );
    const spans = activities.map((item, index) => ({
      id: index + 1,
      activity_id: item.id,
      position: 0,
      start_date: "2026-08-01",
      end_date: "2026-08-01",
    }));
    const setup = behavioralClient(
      { activities, activity_date_spans: spans },
      200,
    );
    mocks.createServerClient.mockResolvedValue(setup.client);

    const result = await listSupabaseActivities();
    const filterSizes = setup.calls
      .filter((call) => call.table === "activity_date_spans")
      .map(
        (call) =>
          (call.operations.find((operation) => operation.name === "in")
            ?.args[1] as unknown[]).length,
      );

    expect(result).toHaveLength(101);
    expect(result.every((item) => item.spans.length === 1)).toBe(true);
    expect(filterSizes).toContain(100);
    expect(filterSizes).toContain(1);
    expect(Math.max(...filterSizes)).toBe(100);
  });

  it("falla cerrado si un cursor numerico o UUID no avanza", () => {
    expect(() =>
      advanceNumericCursor([{ id: 3 }], 3, "prueba numerica"),
    ).toThrow(/no pudo avanzar/);
    expect(() =>
      advanceStringCursor([{ id: uuid(3) }], uuid(3), "prueba UUID"),
    ).toThrow(/no pudo avanzar/);
  });

  it("pagina Papelera y resuelve el actor de la baja", async () => {
    const deletedBy = {
      ...profile(9),
      role: "admin",
      display_name: "Admin de baja",
      is_burson_operator: false,
    };
    const trashed = {
      ...activity(1),
      deleted_at: "2026-08-20T10:00:00Z",
      deleted_by: deletedBy.id,
      deletion_reason: "Duplicada",
    };
    const setup = behavioralClient(
      {
        activities: [trashed],
        activity_date_spans: [],
        profiles: [deletedBy],
      },
      1,
    );
    mocks.createServerClient.mockResolvedValue(setup.client);

    const result = await listSupabaseTrashedActivities();

    expect(result).toHaveLength(1);
    expect(result[0].detailHydration).toBe("summary");
    expect(result[0].deletedBy).toMatchObject({
      accountId: deletedBy.id,
      name: "Admin de baja",
      roleId: "admin",
    });
    expect(
      setup.calls.filter((call) => call.table === "audit_events"),
    ).toHaveLength(0);
  });
});
