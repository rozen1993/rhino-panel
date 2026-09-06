import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "..",
    "supabase",
    "migrations",
    "202608300001_burson_channel.sql",
  ),
  "utf8",
);
const action = readFileSync(
  resolve(process.cwd(), "app", "burson", "actions.ts"),
  "utf8",
);
const readers = readFileSync(
  resolve(process.cwd(), "lib", "supabase", "activities.ts"),
  "utf8",
);
const bursonPage = readFileSync(
  resolve(process.cwd(), "app", "burson", "page.tsx"),
  "utf8",
);
const activityDetailPage = readFileSync(
  resolve(process.cwd(), "app", "actividades", "[id]", "page.tsx"),
  "utf8",
);

describe("canal Burson real", () => {
  it("expone una sola RPC de creación autenticada y deriva al actor", () => {
    expect(migration).toContain(
      "create function public.create_burson_request_v1(",
    );
    expect(migration).toContain("private.require_active_profile('burson')");
    expect(migration).toContain(
      "grant execute on function public.create_burson_request_v1(",
    );
    expect(migration).toContain(
      ") from public, anon, authenticated, service_role;",
    );
    const signature = migration.slice(
      migration.indexOf("create function public.create_burson_request_v1("),
      migration.indexOf(")\nreturns table"),
    );
    for (const forbidden of [
      "p_responsible_id",
      "p_status",
      "p_material_link",
      "p_operator_opinion",
      "p_expected_version",
    ])
      expect(signature).not.toContain(forbidden);
  });

  it("serializa la asignación con transferencias del vínculo especial", () => {
    const lock = migration.indexOf(
      "pg_catalog.hashtextextended('sistema-r-account-administration', 0)",
    );
    const replayRead = migration.indexOf(
      "select candidate.* into existing_activity",
    );
    const specialRead = migration.indexOf(
      "select candidate.* into special_operator",
    );
    expect(lock).toBeGreaterThan(-1);
    expect(lock).toBeLessThan(replayRead);
    expect(lock).toBeLessThan(specialRead);
    expect(migration).toContain("and candidate.is_burson_operator");
    expect(migration).toContain("for update;");
    expect(migration).toContain("errcode = 'SR009'");
    expect(specialRead).toBeGreaterThan(migration.indexOf("if found then"));
  });

  it("mantiene el replay válido después de una transferencia", () => {
    const hash = migration.slice(
      migration.indexOf("request_hash :="),
      migration.indexOf("-- Account administration"),
    );
    expect(hash).toContain("'reference_link', normalized_reference");
    expect(hash).not.toContain("responsible_id");
    expect(migration).not.toContain("responsible_matches");
    expect(migration).toContain(
      "select existing_activity.id, existing_activity.version, true",
    );
  });

  it("fuerza origen, autoría, responsable y campos iniciales en SQL", () => {
    expect(migration).toContain(
      "'burson', burson_profile.id, burson_profile.role",
    );
    expect(migration).toContain(
      "special_operator.id, special_operator.display_name",
    );
    expect(migration).not.toMatch(/set\s+status\s*=/i);
    expect(migration).not.toMatch(/grant\s+(insert|update|delete)/i);
    expect(migration).toContain("date '2026-01-01'");
  });

  it("la acción reautoriza, valida y no envía campos internos", () => {
    expect(action).toContain('role?.id !== "burson"');
    expect(action).toContain("role.mustChangePassword");
    expect(action).toContain('supabase.rpc("create_burson_request_v2"');
    expect(action).toContain("p_reference_link: referenceLink");
    expect(action).not.toContain("p_responsible_id");
    expect(action).not.toContain("p_material_link");
    expect(action).not.toContain("p_operator_opinion");
    expect(action).toContain('revalidatePath("/burson")');
  });

  it("consulta una proyección explícita sin auditoría ni metadatos internos", () => {
    const bursonReaders = readers.slice(
      readers.indexOf("async function fetchBursonRequestRows"),
      readers.indexOf("async function fetchActivitySpans"),
    );
    expect(bursonReaders).toContain('.eq("origin", "burson")');
    expect(bursonReaders).toContain('.gt("id", cursor)');
    expect(bursonReaders).toContain("advanceStringCursor");
    expect(bursonReaders).toContain(
      "chunkValues(ids, supabaseFilterBatchSize)",
    );
    expect(bursonReaders).toContain("advanceNumericCursor");
    expect(bursonReaders).not.toContain(".range(");
    expect(bursonReaders).not.toContain('.select("*")');
    expect(bursonReaders).not.toContain('from("audit_events")');
    for (const hidden of [
      "thread_opened_at",
      "idempotency_key",
      "deleted_by",
      "operator_opinion",
      "created_by_role",
      "responsible_id",
    ])
      expect(bursonReaders).not.toContain(hidden);
  });

  it("retira el aviso Supabase y separa el detalle externo del operativo", () => {
    expect(bursonPage).not.toContain("BackendPhaseNotice");
    expect(bursonPage).toContain("listSupabaseBursonRequests");
    expect(activityDetailPage).toContain(
      'item.id === "admin" || item.id === "operario"',
    );
  });
});
