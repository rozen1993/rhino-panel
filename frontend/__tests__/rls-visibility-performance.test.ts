import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "..",
    "supabase",
    "migrations",
    "202609030001_rls_visibility_performance.sql",
  ),
  "utf8",
);
const executableMigration = migration.replace(/--.*$/gm, "");

const activitiesPolicyStart = migration.indexOf(
  "create policy activities_select_authorized",
);
const activitiesPolicyEnd = migration.indexOf(
  "-- Reutiliza la visibilidad efectiva de activities",
);
const spanPolicyStart = migration.indexOf(
  "create policy activity_date_spans_select_authorized",
);
const spanPolicyEnd = migration.indexOf("-- Una reversion");
if (
  activitiesPolicyStart < 0 ||
  activitiesPolicyEnd <= activitiesPolicyStart ||
  spanPolicyStart < 0 ||
  spanPolicyEnd <= spanPolicyStart
) {
  throw new Error("No se pudieron delimitar las policies RLS optimizadas");
}
const activitiesPolicy = migration.slice(
  activitiesPolicyStart,
  activitiesPolicyEnd,
);
const spanPolicy = migration.slice(spanPolicyStart, spanPolicyEnd);

describe("rendimiento RLS de las jornadas", () => {
  it("delega la rama no Admin a la RLS vigente de activities", () => {
    expect(spanPolicy).toContain("(select private.has_active_app_session())");
    expect(spanPolicy).toContain("case (select private.current_app_role())");
    expect(spanPolicy).toContain("when 'admin'::public.app_role then true");
    expect(spanPolicy).toContain("activity_id in (");
    expect(spanPolicy).toContain("from public.activities visible_activity");
    expect(spanPolicy).not.toContain("private.activity_visible_by_id(");
  });

  it("no crea helpers que acepten contexto de autorizacion falsificable", () => {
    expect(executableMigration).not.toMatch(/activity_visible_pred/i);
    expect(executableMigration).not.toMatch(/activity_visible_by_id/i);
    expect(executableMigration).not.toMatch(/security\s+definer/i);
    expect(executableMigration).not.toMatch(/grant execute on function/i);
  });

  it("conserva literalmente la matriz vigente con contexto por sentencia", () => {
    const admin = activitiesPolicy.indexOf("when 'admin'");
    const operator = activitiesPolicy.indexOf("when 'operario'");
    const burson = activitiesPolicy.indexOf("when 'burson'");
    expect(admin).toBeGreaterThanOrEqual(0);
    expect(admin).toBeLessThan(operator);
    expect(operator).toBeLessThan(burson);
    expect(activitiesPolicy).toContain("deleted_at is null");
    expect(activitiesPolicy).toContain(
      "responsible_id = (select auth.uid())",
    );
    expect(activitiesPolicy).toContain(
      "origin = 'burson'::public.activity_origin",
    );
    expect(activitiesPolicy).toContain("created_by = (select auth.uid())");
    expect(spanPolicy.indexOf("when 'admin'")).toBeLessThan(
      spanPolicy.indexOf("activity_id in ("),
    );
    expect(
      spanPolicy.match(/\(select private\.has_active_app_session\(\)\)/g),
    ).toHaveLength(1);
    expect(
      spanPolicy.match(/\(select private\.current_app_role\(\)\)/g),
    ).toHaveLength(1);
  });

  it("limita la migracion a dos policies sin ampliar privilegios", () => {
    expect(
      migration.match(/drop policy activity_date_spans_select_authorized/g),
    ).toHaveLength(1);
    expect(migration.match(/drop policy activities_select_authorized/g)).toHaveLength(
      1,
    );
    expect(migration.match(/create policy /g)).toHaveLength(2);
    expect(executableMigration).not.toMatch(/create function/i);
    expect(executableMigration).not.toMatch(/drop function/i);
    expect(executableMigration).not.toMatch(/create\s+(unique\s+)?index/i);
    expect(executableMigration).not.toMatch(/statement_timeout/i);
    expect(executableMigration).not.toMatch(/grant\s+(insert|update|delete)/i);
  });
});
