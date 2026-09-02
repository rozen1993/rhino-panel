import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "..",
    "supabase",
    "migrations",
    "202608280001_activity_authority.sql",
  ),
  "utf8",
);
const foundationMigration = readFileSync(
  resolve(
    process.cwd(),
    "..",
    "supabase",
    "migrations",
    "202608220001_backend_foundation.sql",
  ),
  "utf8",
);
const activityForm = readFileSync(
  resolve(process.cwd(), "components", "activity-form.tsx"),
  "utf8",
);

describe("autoridad de actividades del contrato 2026-08-28", () => {
  it("crea el permiso individual false por defecto y separado de Burson", () => {
    expect(migration).toContain(
      "can_create_own_activities boolean not null default false",
    );
    expect(migration).toContain(
      "not can_create_own_activities or (role = 'operario' and is_active)",
    );
    expect(migration).toContain("is_burson_operator");
    expect(migration).toContain("set_operator_creation_permission_v1");
    expect(migration).toContain("candidate.is_active or not p_enabled");
  });

  it("impone el inicio histórico también en las escrituras", () => {
    expect(migration).toContain("activity_date_spans_historical_floor");
    expect(migration).toContain("start_date >= date '2026-01-01'");
    expect(foundationMigration).toContain(
      "(span ->> 'start')::date < date '2026-01-01'",
    );
    expect(activityForm).toContain("min={activityHistoryFloor}");
    expect(activityForm).toContain("min={span.start || activityHistoryFloor}");
  });

  it("serializa la asignación con cambios concurrentes del perfil", () => {
    expect(migration).toMatch(
      /create function private\.require_active_profile[\s\S]*?language plpgsql\s+volatile[\s\S]*?for share;/,
    );
    expect(migration).toMatch(
      /create function private\.require_assignable_operator[\s\S]*?language plpgsql\s+volatile[\s\S]*?for share;/,
    );
    expect(migration).toMatch(
      /create or replace function private\.require_operator_profile\(\)[\s\S]*?language plpgsql\s+volatile/,
    );
    expect(migration).toMatch(
      /create function private\.require_admin_profile\(\)[\s\S]*?language plpgsql\s+volatile/,
    );
  });

  it("permite autoría Admin en el canal ordinario sin abrir el canal Burson", () => {
    expect(migration).toContain(
      "and created_by_role in ('operario', 'admin')",
    );
    expect(migration).toContain(
      "or (origin = 'burson' and created_by_role = 'burson')",
    );
  });

  it("separa las RPC por planificación y ejecución y retira las incompatibles", () => {
    for (const name of [
      "plan_activity_v1",
      "create_own_activity_v1",
      "replan_activity_v1",
      "update_execution_v1",
      "advance_activity_v1",
    ])
      expect(migration).toContain(`function public.${name}`);
    expect(migration).toContain("drop function public.create_activity_v1");
    expect(migration).toContain("drop function public.edit_activity_v1");
  });

  it("fuerza la creación propia al perfil autenticado", () => {
    const ownRpc = migration.slice(
      migration.indexOf("create function public.create_own_activity_v1"),
      migration.indexOf("create function public.replan_activity_v1"),
    );
    expect(ownRpc).not.toContain("p_responsible_id");
    expect(ownRpc).toContain("not operator_profile.can_create_own_activities");
    expect(ownRpc).toContain(
      "operator_profile.id, operator_profile.display_name",
    );
    expect(ownRpc).toContain(
      "activity.responsible_id = operator_profile.id",
    );
    expect(ownRpc).toContain("responsible_matches is distinct from true");
    expect(ownRpc).toMatch(
      /responsible_matches is distinct from true[\s\S]*?errcode = 'SR006'/,
    );
  });

  it("rechaza el replay de planificación si cambió el responsable", () => {
    const planRpc = migration.slice(
      migration.indexOf("create function public.plan_activity_v1"),
      migration.indexOf("create function public.create_own_activity_v1"),
    );
    expect(planRpc).toContain("activity.responsible_id = responsible.id");
    expect(planRpc).toContain("responsible_matches is distinct from true");
  });

  it("limita la lectura del Operario a actividades bajo su responsabilidad", () => {
    const visibility = migration.slice(
      migration.indexOf("create or replace function private.can_view_activity"),
      migration.indexOf("create function private.require_active_profile"),
    );
    expect(visibility).toContain("activity_responsible_id = auth.uid()");
    expect(visibility).not.toContain("is_burson_operator");
    expect(visibility).toContain(
      "activity_origin = 'burson' and activity_created_by = auth.uid()",
    );
  });

  it("deja la planificación en Admin y la ejecución en el responsable", () => {
    const replan = migration.slice(
      migration.indexOf("create function public.replan_activity_v1"),
      migration.indexOf("create function public.update_execution_v1"),
    );
    const execution = migration.slice(
      migration.indexOf("create function public.update_execution_v1"),
      migration.indexOf("create or replace function public.advance_activity_v1"),
    );
    expect(replan).toContain("private.require_admin_profile()");
    expect(replan).toContain("responsible_id = responsible.id");
    expect(execution).toContain("private.require_operator_profile()");
    expect(execution).toContain(
      "activity.responsible_id <> operator_profile.id",
    );
    expect(execution).not.toMatch(/set\s+(?:type|title|description|place)\s*=/);
    expect(replan).toContain("activity.status = 'Entregada'");
    expect(replan).toContain(
      "delivered Burson activity keeps its historical responsible",
    );
  });

  it("bloquea solo enlace y opinión cuando se abre la conversación", () => {
    expect(migration).toContain("activity.thread_opened_at is not null");
    const advance = migration.slice(
      migration.indexOf("create or replace function public.advance_activity_v1"),
      migration.indexOf(
        "create function public.set_operator_creation_permission_v1",
      ),
    );
    expect(advance).not.toContain("thread_opened_at");
  });

  it("mantiene obligatorios los dos campos de la RPC de ejecución", () => {
    const execution = migration.slice(
      migration.indexOf("create function public.update_execution_v1"),
      migration.indexOf("create or replace function public.advance_activity_v1"),
    );
    expect(execution).toContain("p_material_link text,");
    expect(execution).toContain("p_operator_opinion text");
    expect(execution).not.toContain("p_material_link text default");
    expect(execution).not.toContain("p_operator_opinion text default");
    expect(execution).toContain(
      "activity.status = 'Entregada' and normalized_material_link = ''",
    );
  });

  it("bloquea negocio durante la clave temporal sin ocultar el perfil propio", () => {
    expect(migration).toContain(
      "must_change_password boolean not null default false",
    );
    expect(migration).toContain("and not profile.must_change_password");
    expect(migration).toContain("and not candidate.must_change_password");
  });

  it("audita el permiso en una tabla administrativa con RLS", () => {
    expect(migration).toContain("create table public.account_audit_events");
    expect(migration).toContain(
      "alter table public.account_audit_events enable row level security",
    );
    expect(migration).toContain("Permiso de creación propia concedido");
    expect(migration).toContain("Permiso de creación propia retirado");
    expect(migration).not.toMatch(
      /grant\s+(insert|update|delete)\s+on\s+public\.account_audit_events/i,
    );
  });
});
