import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "..",
    "supabase",
    "migrations",
    "202608300002_private_conversations.sql",
  ),
  "utf8",
);
const readers = readFileSync(
  resolve(process.cwd(), "lib", "supabase", "activities.ts"),
  "utf8",
);

function functionBlock(name: string, nextName: string) {
  return migration.slice(
    migration.indexOf(`function public.${name}`),
    migration.indexOf(`function public.${nextName}`),
  );
}

describe("conversación privada real", () => {
  it("persiste mensajes internos con apertura Admin y baja lógica", () => {
    expect(migration).toContain("create table public.activity_messages");
    expect(migration).toContain("activity_messages_internal_author");
    expect(migration).toContain("author_role in ('admin', 'operario')");
    expect(migration).toContain("activity_messages_opened_by_admin");
    expect(migration).toContain("not opens_thread or author_role = 'admin'");
    expect(migration).toContain("activity_messages_single_opening");
    expect(migration).toContain("where opens_thread;");
    expect(migration).toContain("deleted_by = author_id");
    expect(migration).toContain("version integer not null default 1");
  });

  it("usa RLS fail-closed y nunca concede escritura directa", () => {
    const helper = migration.slice(
      migration.indexOf(
        "create function private.can_access_activity_conversation",
      ),
      migration.indexOf(
        "alter table public.activity_messages enable row level security",
      ),
    );
    expect(helper).toContain("private.current_app_role() = 'admin'");
    expect(helper).toContain("private.current_app_role() = 'operario'");
    expect(helper).toContain("activity.responsible_id = auth.uid()");
    expect(helper).toContain("activity.deleted_at is null");
    expect(helper).toContain("else false");

    const policy = migration.slice(
      migration.indexOf("create policy activity_messages_select_participants"),
      migration.indexOf(
        "create function public.post_activity_message_v1",
      ),
    );
    expect(policy).toContain("deleted_at is null");
    expect(policy).toContain(
      "private.can_access_activity_conversation(activity_id)",
    );
    expect(policy).toContain(
      "grant select on table public.activity_messages to authenticated",
    );
    expect(migration).toContain(
      "from public, anon, authenticated, service_role",
    );
    expect(migration).not.toMatch(
      /grant\s+(?:insert|update|delete)\s+on\s+(?:table\s+)?public\.activity_messages/i,
    );
    expect(migration).not.toContain("create view public.activity_thread_messages");
  });

  it("serializa la apertura y desacopla las respuestas de la planificación", () => {
    const post = functionBlock(
      "post_activity_message_v1",
      "edit_activity_message_v1",
    );
    const signature = post.slice(0, post.indexOf("returns table"));
    for (const forbidden of [
      "p_author_id",
      "p_author_role",
      "p_responsible_id",
      "p_status",
    ])
      expect(signature).not.toContain(forbidden);
    expect(post).toContain("private.require_active_profile()");
    expect(post).toContain(
      "is_opening boolean := p_expected_activity_version is not null",
    );
    expect(post).toContain("for update;");
    expect(post).toContain("for share;");
    expect(post).toContain("activity.status <> 'Entregada'");
    expect(post).toContain("actor.role <> 'admin'");
    expect(post).toContain("activity.thread_opened_at is not null");
    expect(post).toContain("activity.thread_opened_at is null");

    const openingMutation = post.indexOf("update public.activities target");
    const replyBranch = post.indexOf("else", openingMutation);
    expect(openingMutation).toBeGreaterThan(post.lastIndexOf("if is_opening then"));
    expect(openingMutation).toBeLessThan(replyBranch);
    expect(post.slice(replyBranch)).not.toContain("update public.activities");
    expect(post).toContain("version = next_activity_version");
  });

  it("edita y da de baja solo al autor con lock y versión del mensaje", () => {
    const edit = functionBlock(
      "edit_activity_message_v1",
      "delete_activity_message_v1",
    );
    const remove = migration.slice(
      migration.indexOf("function public.delete_activity_message_v1"),
      migration.indexOf("create or replace function public.update_execution_v1"),
    );
    for (const block of [edit, remove]) {
      expect(block.indexOf("for share;")).toBeGreaterThan(-1);
      expect(block.indexOf("for share;")).toBeLessThan(
        block.indexOf("for update;"),
      );
      expect(block).toContain("message_record.author_id <> actor.id");
      expect(block).toContain("message_record.version <> p_expected_message_version");
      expect(block).toContain("next_message_version := message_record.version + 1");
      expect(block).not.toContain("update public.activities");
    }
    expect(edit).toContain("set body = normalized_body");
    expect(remove).toContain("set deleted_at = now()");
    expect(remove).toContain("deleted_by = actor.id");
    expect(remove).not.toContain("set body = ''");
  });

  it("audita sin copiar el cuerpo y conserva el bloqueo al borrar la apertura", () => {
    expect(migration).toContain("'Admin inició la conversación'");
    expect(migration).toContain("'Mensaje agregado'");
    expect(migration).toContain("'Mensaje editado'");
    expect(migration).toContain("'Mensaje eliminado lógicamente'");
    expect(migration).toContain("'mensaje_id'");
    expect(migration).not.toContain("jsonb_build_object('body'");
    expect(readers).toContain('typeof entry.mensaje_id === "string"');
    expect(readers).toContain("return `Mensaje ${entry.mensaje_id}`;");

    const remove = migration.slice(
      migration.indexOf("function public.delete_activity_message_v1"),
      migration.indexOf("create or replace function public.update_execution_v1"),
    );
    expect(remove).not.toContain("thread_opened_at = null");
    expect(remove).not.toContain("opens_thread = false");
  });

  it("prioriza el bloqueo permanente sobre una versión obsoleta de ejecución", () => {
    const execution = migration.slice(
      migration.indexOf("create or replace function public.update_execution_v1"),
      migration.indexOf(
        "revoke all on function private.can_access_activity_conversation",
      ),
    );
    expect(execution.indexOf("activity.thread_opened_at is not null")).toBeLessThan(
      execution.indexOf("activity.version <> p_expected_version"),
    );
    expect(execution).not.toMatch(/set\s+(?:type|title|description|place)\s*=/);
  });

  it("hidrata el hilo solo en el detalle interno y excluye bajas", () => {
    expect(readers).toMatch(
      /return\s+hydrateActivities\(\s*rows,\s*"summary"\s*\)/,
    );
    expect(readers).toMatch(
      /const hydrated = await hydrateActivities\(\s*rows,\s*"complete"\s*\)/,
    );
    expect(readers).toContain('.from("activity_messages")');
    expect(readers).toContain('.is("deleted_at", null)');
    expect(readers).toContain("opensThread: message.opens_thread");

    const bursonReader = readers.slice(
      readers.indexOf("async function fetchBursonRequestRows"),
      readers.indexOf("function detailText"),
    );
    expect(bursonReader).not.toContain('.from("activity_messages")');
  });
});
