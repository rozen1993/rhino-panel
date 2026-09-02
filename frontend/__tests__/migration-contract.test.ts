import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "..",
    "supabase",
    "migrations",
    "202608220001_backend_foundation.sql",
  ),
  "utf8",
);
const authorityMigration = readFileSync(
  resolve(
    process.cwd(),
    "..",
    "supabase",
    "migrations",
    "202608280001_activity_authority.sql",
  ),
  "utf8",
);

describe("contrato estático de la migración inicial", () => {
  it("crea las cinco tablas del cimiento", () => {
    for (const table of [
      "profiles",
      "app_sessions",
      "activities",
      "activity_date_spans",
      "audit_events",
    ]) {
      expect(migration).toContain(`create table public.${table}`);
    }
  });

  it("habilita RLS explícitamente y no concede escrituras directas", () => {
    expect(migration.match(/enable row level security/g)).toHaveLength(5);
    expect(migration.match(/revoke all on table public\./g)).toHaveLength(5);
    expect(migration).not.toMatch(/grant\s+(insert|update|delete)/i);
  });

  it("aplica sesión de 12 horas, revocación y perfil activo dentro de SQL", () => {
    expect(migration).toContain("interval '12 hours'");
    expect(migration).toContain("session.revoked_at is null");
    expect(migration).toContain("profile.is_active");
    expect(migration).toContain("auth.jwt() ->> 'session_id'");
    expect(migration).toContain(
      "expires_at <= started_at + interval '12 hours'",
    );
  });

  it("protege concurrencia e idempotencia ante llamadas RPC directas", () => {
    expect(
      migration.match(/p_expected_version is null/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(2);
    expect(migration).toContain("idempotency_hash text");
    expect(migration).toContain("activity.idempotency_hash = request_hash");
    expect(migration).toContain("idempotency_hash is not null");
    expect(migration).toContain("replay_matches is distinct from true");
    expect(migration).toContain("errcode = 'SR006'");
  });

  it("no expone auditoría interna a Burson", () => {
    expect(migration).toContain("private.current_app_role() <> 'burson'");
  });

  it("documenta el cimiento y su sustitución por las RPC vigentes", () => {
    for (const fn of [
      "register_app_session",
      "revoke_current_app_session",
      "advance_activity_v1",
    ]) {
      expect(migration).toContain(`function public.${fn}`);
    }
    for (const legacy of ["create_activity_v1", "edit_activity_v1"]) {
      expect(migration).toContain(`function public.${legacy}`);
      expect(authorityMigration).toContain(`drop function public.${legacy}`);
    }
    for (const current of [
      "plan_activity_v1",
      "create_own_activity_v1",
      "replan_activity_v1",
      "update_execution_v1",
      "advance_activity_v1",
    ])
      expect(authorityMigration).toContain(`function public.${current}`);
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("auth.uid()");
  });

  it("no deja invocables los auxiliares privados de escritura", () => {
    expect(migration).toContain(
      "revoke all on function private.require_operator_profile()",
    );
    expect(migration).toContain(
      "revoke all on function private.assert_activity_payload(text, text, jsonb, text)",
    );
    expect(migration).not.toContain(
      "grant execute on function private.require_operator_profile()",
    );
  });
});
